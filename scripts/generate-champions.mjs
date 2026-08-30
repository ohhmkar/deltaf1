// Generates src/data/championsHistory.json: a per-driver/constructor count of
// championship wins, keyed by Ergast/jolpi id. Historical standings are
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

async function getChampion(year, table) {
  let res;
  let lastErr;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      res = await fetch(`${BASE}/${year}/${table}/1.json`);
      if (res.status !== 429) break;
    } catch (err) {
      lastErr = err; // transient network error, not an HTTP status - retry too
    }
    await sleep(1000 * (attempt + 1)); // backoff and retry - never silently skip a year
  }
  if (!res) throw lastErr ?? new Error(`${year} ${table}: no response`);
  if (!res.ok) throw new Error(`${year} ${table}: HTTP ${res.status}`);
  const data = await res.json();
  const list = data.MRData.StandingsTable.StandingsLists[0];
  if (!list) return null; // season not run / no data yet
  const standing = table === "driverStandings"
    ? list.DriverStandings[0]
    : list.ConstructorStandings[0];
  return table === "driverStandings"
    ? standing.Driver.driverId
    : standing.Constructor.constructorId;
}

async function countChampions(startYear, table) {
  const counts = {};
  for (let year = startYear; year <= CURRENT_YEAR; year++) {
    try {
      const id = await getChampion(year, table);
      if (id) counts[id] = (counts[id] || 0) + 1;
      process.stdout.write(`${year}: ${id ?? "(no data)"}\n`);
    } catch (err) {
      console.error(`  skipping ${year}: ${err.message}`);
    }
    await sleep(250); // stay well under jolpi's rate limit
  }
  return counts;
}

const drivers = await countChampions(1950, "driverStandings");
await sleep(3000); // cool down between phases - jolpi's limit is cumulative, not just per-request
const constructors = await countChampions(1958, "constructorStandings"); // Constructors' Championship started 1958

const out = { generatedAt: new Date().toISOString(), drivers, constructors };
await import("node:fs/promises").then((fs) =>
  fs.writeFile(
    new URL("../src/data/championsHistory.json", import.meta.url),
    JSON.stringify(out, null, 2) + "\n"
  )
);
console.log("Wrote src/data/championsHistory.json");
