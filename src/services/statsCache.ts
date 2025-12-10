import { fetchData } from "./api";
import type { CareerStats } from "../types";

const CACHE_KEY = "f1_career_stats";
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedStats {
  data: Record<string, CareerStats>;
  timestamp: number;
  defendingDriverId: string | null;
  defendingConstructorId: string | null;
}

// Check if cached data is still valid
const getCachedStats = (): CachedStats | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const parsed: CachedStats = JSON.parse(cached);
    const now = Date.now();

    if (now - parsed.timestamp > CACHE_EXPIRY_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

// Save stats to cache
const setCachedStats = (
  data: Record<string, CareerStats>,
  defendingDriverId: string | null,
  defendingConstructorId: string | null
) => {
  try {
    const cached: CachedStats = {
      data,
      timestamp: Date.now(),
      defendingDriverId,
      defendingConstructorId,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch (e) {
    console.warn("Failed to cache stats:", e);
  }
};

// Batch fetch with rate limiting (4 concurrent requests max)
const fetchInBatches = async <T>(
  items: { id: string; type: "drivers" | "constructors" }[],
  fetchFn: (id: string, type: "drivers" | "constructors") => Promise<T>,
  batchSize = 4,
  delayMs = 300
): Promise<Map<string, T>> => {
  const results = new Map<string, T>();

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async ({ id, type }) => ({
        id,
        result: await fetchFn(id, type),
      }))
    );

    batchResults.forEach(({ id, result }) => results.set(id, result));

    // Delay between batches (not after last batch)
    if (i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
};

// Fetch stats for a single entity (wins & poles only - championships removed to avoid rate limiting)
const fetchEntityWinsAndPoles = async (
  id: string,
  statType: "drivers" | "constructors"
): Promise<{ wins: number; poles: number }> => {
  try {
    // Use limit=1 instead of limit=0 as Jolpi API returns total correctly with limit=1
    const [winsData, polesData] = await Promise.all([
      fetchData(`/${statType}/${id}/results/1.json?limit=1`),
      fetchData(`/${statType}/${id}/qualifying/1.json?limit=1`),
    ]);

    return {
      wins: parseInt(winsData?.total || "0"),
      poles: parseInt(polesData?.total || "0"),
    };
  } catch (err) {
    console.error(`Error fetching wins/poles for ${id}:`, err);
    return { wins: 0, poles: 0 };
  }
};

// Global state for loading status
let isLoading = false;
let loadPromise: Promise<CachedStats | null> | null = null;
const listeners: ((stats: CachedStats | null) => void)[] = [];

// Subscribe to stats updates
export const subscribeToStats = (
  callback: (stats: CachedStats | null) => void
) => {
  listeners.push(callback);
  // Immediately call with cached data if available
  const cached = getCachedStats();
  if (cached) callback(cached);

  return () => {
    const idx = listeners.indexOf(callback);
    if (idx > -1) listeners.splice(idx, 1);
  };
};

// Notify all listeners
const notifyListeners = (stats: CachedStats | null) => {
  listeners.forEach((cb) => cb(stats));
};

// Preload career stats - call this on app startup
export const preloadCareerStats = async (): Promise<CachedStats | null> => {
  // Return cached if available
  const cached = getCachedStats();
  if (cached) {
    notifyListeners(cached);
    return cached;
  }

  // If already loading, return existing promise
  if (isLoading && loadPromise) {
    return loadPromise;
  }

  isLoading = true;

  loadPromise = (async () => {
    try {
      const currentYear = new Date().getFullYear();
      const prevYear = currentYear - 1;

      // Fetch current drivers/constructors and previous year champions
      const [dData, cData, prevDData, prevCData] = await Promise.all([
        fetchData("/current/driverStandings.json"),
        fetchData("/current/constructorStandings.json"),
        fetchData(`/${prevYear}/driverStandings.json?limit=1`),
        fetchData(`/${prevYear}/constructorStandings.json?limit=1`),
      ]);

      const driverList =
        dData?.StandingsTable?.StandingsLists[0]?.DriverStandings || [];
      const teamList =
        cData?.StandingsTable?.StandingsLists[0]?.ConstructorStandings || [];

      const defendingDriverId =
        prevDData?.StandingsTable?.StandingsLists[0]?.DriverStandings[0]?.Driver
          ?.driverId || null;
      const defendingConstructorId =
        prevCData?.StandingsTable?.StandingsLists[0]?.ConstructorStandings[0]
          ?.Constructor?.constructorId || null;

      // Build list of entities to fetch wins/poles for
      const entities: { id: string; type: "drivers" | "constructors" }[] = [
        ...driverList.map((d: any) => ({
          id: d.Driver.driverId,
          type: "drivers" as const,
        })),
        ...teamList.map((c: any) => ({
          id: c.Constructor.constructorId,
          type: "constructors" as const,
        })),
      ];

      // Fetch wins/poles in batches (2 at a time with longer delays to avoid rate limiting)
      const winsPolesMap = await fetchInBatches(
        entities,
        (id, type) => fetchEntityWinsAndPoles(id, type),
        2,
        500
      );

      // Build stats record (championships set to 0 to avoid rate limiting)
      const statsRecord: Record<string, CareerStats> = {};
      winsPolesMap.forEach((winsPoles, id) => {
        const isDriver = driverList.some((d: any) => d.Driver.driverId === id);
        const defending = isDriver
          ? id === defendingDriverId
          : id === defendingConstructorId;

        statsRecord[id] = {
          wins: winsPoles.wins,
          poles: winsPoles.poles,
          championships: 0, // Removed to avoid API rate limiting
          defending,
        };
      });

      // Cache the results
      setCachedStats(statsRecord, defendingDriverId, defendingConstructorId);

      const result: CachedStats = {
        data: statsRecord,
        timestamp: Date.now(),
        defendingDriverId,
        defendingConstructorId,
      };

      notifyListeners(result);
      return result;
    } catch (e) {
      console.error("Failed to preload career stats:", e);
      return null;
    } finally {
      isLoading = false;
      loadPromise = null;
    }
  })();

  return loadPromise;
};

// Get current loading status
export const isStatsLoading = () => isLoading;

// Get cached stats synchronously
export const getCachedCareerStats = () => getCachedStats();

// Force refresh (bypass cache)
export const refreshCareerStats = async () => {
  localStorage.removeItem(CACHE_KEY);
  return preloadCareerStats();
};
