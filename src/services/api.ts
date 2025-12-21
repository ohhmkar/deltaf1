import { apiCache } from "./cache";

export const API_BASE = "https://api.jolpi.ca/ergast/f1";

interface FetchOptions {
  useCache?: boolean;
  cacheTime?: number;
  retries?: number;
  retryDelay?: number;
}

// Sleep helper for retry delays
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchData = async (
  endpoint: string,
  options: FetchOptions = {}
): Promise<any> => {
  const {
    useCache = true,
    cacheTime = 5 * 60 * 1000, // 5 minutes default
    retries = 2,
    retryDelay = 1000,
  } = options;

  const cacheKey = `api:${endpoint}`;

  // Check cache first
  if (useCache && apiCache.has(cacheKey)) {
    return apiCache.get(cacheKey);
  }

  let lastError: Error | null = null;

  // Retry logic
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      const result = data.MRData;

      // Cache successful response
      if (useCache) {
        apiCache.set(cacheKey, result, cacheTime);
      }

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");
      console.error(`API Error (attempt ${attempt + 1}/${retries + 1}):`, error);

      // Don't wait after last attempt
      if (attempt < retries) {
        await sleep(retryDelay * (attempt + 1)); // Exponential backoff
      }
    }
  }

  // All retries failed
  throw lastError || new Error("Failed to fetch data");
};

// Telemetry-specific API calls
export const fetchRaceResults = async (
  season: string,
  round: string
): Promise<any> => {
  return await fetchData(`/${season}/${round}/results.json`);
};

export const fetchLapTimes = async (
  season: string,
  round: string
): Promise<any> => {
  return await fetchData(`/${season}/${round}/laps.json?limit=2000`);
};

export const fetchPitStops = async (
  season: string,
  round: string
): Promise<any> => {
  return await fetchData(`/${season}/${round}/pitstops.json`);
};

export const fetchQualifyingResults = async (
  season: string,
  round: string
): Promise<any> => {
  return await fetchData(`/${season}/${round}/qualifying.json`);
};
