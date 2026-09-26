// Generates src/data/championsHistory.json: per-driver/constructor lists of
// championship years, keyed by Ergast/jolpi id. Historical standings are
// permanent (a 1961 result never changes), so this only needs re-running once
// a season, right after the finale - see README "Updating generated data".
//
// Why a script instead of a live API call: jolpi.ca (the Ergast mirror this
// app uses) requires a season in the path for driverStandings/constructor-
// Standings queries - there's no "give me every season this driver won" call
// like classic Ergast had. Recomputing that live would mean one request per
// season since 1950/1958, which is the exact rate-limit problem this avoids.
//
// Run: node scripts/generate-champions.mjs

const BASE = "https://api.jolpi.ca/ergast/f1";
const CURRENT_YEAR = new Date().getFullYear();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url) {
  let res;
  let lastErr;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      res = await fetch(url);
      if (res.status !== 429) break;
    } catch (err) {
      lastErr = err; // transient network error, not an HTTP status - retry too
    }
    await sleep(1000 * (attempt + 1)); // backoff and retry - never silently skip
  }
  if (!res) throw lastErr ?? new Error(`${url}: no response`);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json();
}

// A season's driverStandings/constructorStandings/1.json always returns
// whoever currently leads, mid-season or not - the current calendar year's
// "leader" is not a champion until the season has actually run its full
// schedule. Only checked for the current year; every earlier year is
// definitionally already complete.
async function isSeasonComplete(year, standingsRound) {
  if (year !== CURRENT_YEAR) return true;
  const schedule = await fetchJson(`${BASE}/${year}.json?limit=1`);
  const totalRaces = parseInt(schedule.MRData.total, 10);
  return parseInt(standingsRound, 10) >= totalRaces;
}

async function getChampion(year, table) {
  const data = await fetchJson(`${BASE}/${year}/${table}/1.json`);
  const list = data.MRData.StandingsTable.StandingsLists[0];
  if (!list) return null; // season not run / no data yet
  if (!(await isSeasonComplete(year, list.round))) return null; // season in progress - no champion yet
  const standing = table === "driverStandings"
    ? list.DriverStandings[0]
    : list.ConstructorStandings[0];
  return table === "driverStandings"
    ? standing.Driver.driverId
    : standing.Constructor.constructorId;
}

async function championYears(startYear, table) {
  const years = {};
  for (let year = startYear; year <= CURRENT_YEAR; year++) {
    try {
      const id = await getChampion(year, table);
      if (id) (years[id] ??= []).push(year);
      process.stdout.write(`${year}: ${id ?? "(no champion yet / no data)"}\n`);
    } catch (err) {
      console.error(`  skipping ${year}: ${err.message}`);
    }
    await sleep(250); // stay well under jolpi's rate limit
  }
  return years;
}

// jolpi files a few old results under a variant constructor id; Bruce
// McLaren's and Hulme's 1968-69 wins are "mclaren-ford", not "mclaren".
const ALIASES = { mclaren: ["mclaren-ford"] };

// Poles that don't show as a grid-1 start. 2022 sprint weekends credited pole
// to the Friday qualifier while the sprint winner started P1: Magnussen/Haas,
// 2022 Sao Paulo GP (Russell started first). Wikipedia: Haas 1 pole.
const POLE_FIXES = { haas: 1, kevin_magnussen: 1 };

// Races (not rows - a 1950s shared drive gives two P1 rows) where this
// driver/constructor won, or started from pole. Poles are grid-1 starts:
// jolpi's qualifying table only covers recent seasons (Ferrari: 105 vs 254),
// and grid 1 matched Wikipedia exactly for every driver and team checked.
async function countRaces(type, id, kind) {
  const path = kind === "wins" ? "results/1" : "grid/1/results";
  const hit = (r) =>
    (kind === "wins" ? r.position === "1" : r.grid === "1") &&
    (type === "drivers" ? r.Driver.driverId === id : true);
  let n = 0;
  for (const cid of [id, ...(type === "constructors" ? ALIASES[id] ?? [] : [])])
    for (let offset = 0; ; offset += 100) {
      const d = (await fetchJson(`${BASE}/${type}/${cid}/${path}.json?limit=100&offset=${offset}`)).MRData;
      n += d.RaceTable.Races.filter((race) => race.Results.some(hit)).length;
      await sleep(250);
      if (offset + 100 >= parseInt(d.total, 10)) break;
    }
  return n;
}

// Current-season poles (grid-1 starts), keyed by driver and constructor id.
const polesIn = (races) => {
  const out = {};
  for (const race of races)
    for (const r of race.Results.filter((r) => r.grid === "1")) {
      out[r.Driver.driverId] = (out[r.Driver.driverId] || 0) + 1;
      out[r.Constructor.constructorId] = (out[r.Constructor.constructorId] || 0) + 1;
    }
  return out;
};

// Career wins/poles for the current grid, *excluding* the season in progress:
// the app adds live current-season wins (from standings) and poles (one
// request) on top, instead of 2 requests per driver and team.
async function careerBaseline() {
  const [dS, cS, grid1] = await Promise.all([
    fetchJson(`${BASE}/current/driverStandings.json?limit=100`),
    fetchJson(`${BASE}/current/constructorStandings.json?limit=100`),
    fetchJson(`${BASE}/current/grid/1/results.json?limit=100`),
  ]);
  const table = dS.MRData.StandingsTable;
  const list = table.StandingsLists[0];
  const season = parseInt(table.season, 10);
  // ponytail: pre-season (no standings yet) there's no grid to baseline; run it after round 1
  if (!list) throw new Error(`${season} has no standings yet - re-run after round 1`);
  // finished season: nothing is live any more, so the baseline includes it
  const complete = await isSeasonComplete(season, list.round);
  const throughSeason = complete ? season : season - 1;
  const curPoles = complete ? {} : polesIn(grid1.MRData.RaceTable.Races);

  const entities = [
    ...list.DriverStandings.map((s) => ["drivers", s.Driver.driverId, s.wins]),
    ...(cS.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings ?? []).map((s) => [
      "constructors",
      s.Constructor.constructorId,
      s.wins,
    ]),
  ];
  const out = {};
  for (const [type, id, curWins] of entities) {
    const wins = await countRaces(type, id, "wins");
    const poles = await countRaces(type, id, "poles");
    out[id] = {
      wins: wins - (complete ? 0 : parseInt(curWins, 10)),
      poles: poles + (POLE_FIXES[id] || 0) - (curPoles[id] || 0),
    };
    process.stdout.write(`${id}: ${JSON.stringify(out[id])}\n`);
  }
  return { throughSeason, career: out };
}

const drivers = await championYears(1950, "driverStandings");
await sleep(3000); // cool down between phases - jolpi's limit is cumulative, not just per-request
const constructors = await championYears(1958, "constructorStandings");
await sleep(3000);
const { throughSeason, career } = await careerBaseline();

// last completed season's champions, for the "defending" star
const [defDriver, defConstructor] = await Promise.all([
  getChampion(throughSeason, "driverStandings"),
  getChampion(throughSeason, "constructorStandings"),
]);

const out = {
  generatedAt: new Date().toISOString(),
  drivers,
  constructors,
  defending: { driver: defDriver, constructor: defConstructor },
  throughSeason,
  career,
};
await import("node:fs/promises").then((fs) =>
  fs.writeFile(
    new URL("../src/data/championsHistory.json", import.meta.url),
    JSON.stringify(out, null, 2) + "\n"
  )
);
console.log("Wrote src/data/championsHistory.json");
