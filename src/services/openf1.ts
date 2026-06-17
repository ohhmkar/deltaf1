import { apiCache } from "./cache";

// OpenF1 returns plain JSON arrays (unlike the Ergast wrapper in api.ts), so it
// gets its own tiny fetch. Historical data (2023+) is free / no auth.
const BASE = "https://api.openf1.org/v1";

async function get<T>(path: string, cacheMs = 30 * 60 * 1000): Promise<T> {
  const key = `openf1:${path}`;
  const cached = apiCache.get(key);
  if (cached) return cached;
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`OpenF1 ${res.status}: ${res.statusText}`);
  const data = await res.json();
  apiCache.set(key, data, cacheMs);
  return data;
}

export interface OF1Session {
  session_key: number;
  session_name: string;
  country_name: string;
  circuit_short_name: string;
  location: string;
  date_start: string;
  date_end: string;
  year: number;
}

export interface OF1Driver {
  driver_number: number;
  name_acronym: string;
  team_colour: string | null;
  full_name: string;
}

export interface OF1Loc {
  driver_number: number;
  date: string;
  x: number;
  y: number;
}

export interface OF1RaceControl {
  date: string;
  category: string;
  flag: string | null;
  message: string;
  lap_number: number | null;
}

export const fetchRaceControl = (sessionKey: number) =>
  get<OF1RaceControl[]>(`/race_control?session_key=${sessionKey}`);

export const fetchRaceSessions = (year: number) =>
  get<OF1Session[]>(`/sessions?year=${year}&session_name=Race`);

export const fetchDrivers = (sessionKey: number) =>
  get<OF1Driver[]>(`/drivers?session_key=${sessionKey}`);

// from/to are Date objects; serialized as ...Z (no "+" offset that query strings
// would read as a space).
export const fetchLocations = (
  sessionKey: number,
  from: Date,
  to: Date,
  driver?: number
) =>
  get<OF1Loc[]>(
    `/location?session_key=${sessionKey}` +
      (driver ? `&driver_number=${driver}` : "") +
      `&date>${from.toISOString()}&date<${to.toISOString()}`
  );
