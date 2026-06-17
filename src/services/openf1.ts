import { apiCache } from "./cache";

// OpenF1 returns plain JSON arrays (unlike the Ergast wrapper in api.ts), so it
// gets its own tiny fetch. Historical data (2023+) is free / no auth.
const BASE = "https://api.openf1.org/v1";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// OpenF1's free tier rate-limits bursts, so requests run through a single
// queue (spaced out) and retry on 429. ponytail: serial is plenty fast here
// since responses are cached after first load.
let queue: Promise<unknown> = Promise.resolve();

async function rawGet<T>(path: string): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(`${BASE}${path}`);
    if (res.status === 429) {
      await sleep(700 * (attempt + 1));
      continue;
    }
    if (!res.ok) throw new Error(`OpenF1 ${res.status}: ${res.statusText}`);
    return res.json();
  }
  throw new Error("OpenF1 429: rate limited");
}

async function get<T>(path: string, cacheMs = 30 * 60 * 1000): Promise<T> {
  const key = `openf1:${path}`;
  const cached = apiCache.get(key);
  if (cached) return cached;
  const run = queue.then(() => rawGet<T>(path));
  queue = run.then(() => sleep(120), () => sleep(120)); // space requests, ignore errors
  const data = await run;
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

export interface OF1Position {
  date: string;
  driver_number: number;
  position: number;
}

export const fetchPositions = (sessionKey: number) =>
  get<OF1Position[]>(`/position?session_key=${sessionKey}`);

export interface OF1Interval {
  date: string;
  driver_number: number;
  gap_to_leader: number | string | null;
}

// windowed (the full-session pull is ~4MB); same date-range trick as location
export const fetchIntervals = (sessionKey: number, from: Date, to: Date) =>
  get<OF1Interval[]>(
    `/intervals?session_key=${sessionKey}` +
      `&date>${from.toISOString()}&date<${to.toISOString()}`
  );

export interface OF1Stint {
  driver_number: number;
  compound: string;
  lap_start: number;
  lap_end: number;
  tyre_age_at_start: number;
}

export const fetchStints = (sessionKey: number) =>
  get<OF1Stint[]>(`/stints?session_key=${sessionKey}`);

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
