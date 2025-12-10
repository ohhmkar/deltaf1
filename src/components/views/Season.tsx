import React, { useState, useEffect } from "react";
import { fetchData } from "../../services/api";
import {
  getTeamHex,
  getCircuitData,
  formatDateLocal,
} from "../../utils/helpers";
import { Flag } from "../shared";
import type { Race, PitStop } from "../../types";

export const Season: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState<string | null>(null);
  const [raceDetails, setRaceDetails] = useState<Race | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [pitStops, setPitStops] = useState<PitStop[]>([]);

  const years = Array.from(
    { length: currentYear - 1950 + 1 },
    (_, i) => currentYear - i
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setRaces([]);
      setSelectedRound(null);
      try {
        const endpoint =
          year === currentYear ? "/current.json" : `/${year}.json`;
        const data = await fetchData(endpoint);
        if (data && data.RaceTable) {
          setRaces(data.RaceTable.Races);
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    load();
  }, [year]);

  const handleRaceClick = async (race: Race) => {
    const raceDate = new Date(`${race.date}T${race.time}`);
    // Allow clicking for past years or past races in current year
    if (year === currentYear && raceDate > new Date()) return;

    setLoadingDetails(true);
    setSelectedRound(race.round);
    setRaceDetails(null);
    setPitStops([]);

    try {
      const [resData, pitData] = await Promise.all([
        fetchData(`/${race.season}/${race.round}/results.json`),
        fetchData(`/${race.season}/${race.round}/pitstops.json?limit=100`),
      ]);

      if (resData && resData.RaceTable && resData.RaceTable.Races.length > 0) {
        setRaceDetails(resData.RaceTable.Races[0]);
      }
      if (pitData && pitData.RaceTable && pitData.RaceTable.Races.length > 0) {
        setPitStops(pitData.RaceTable.Races[0].PitStops);
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingDetails(false);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-full">
        <div className="loader"></div>
      </div>
    );

  if (selectedRound) {
    const circuitData = raceDetails
      ? getCircuitData(raceDetails.Circuit.circuitId)
      : { img: "", record: "N/A", mostWins: "N/A" };

    return (
      <div className="p-6 md:p-16 max-w-5xl mx-auto h-screen overflow-y-auto fade-in pb-24">
        <button
          onClick={() => setSelectedRound(null)}
          className="mb-6 text-neutral-500 hover:text-white flex items-center transition-colors text-sm group"
        >
          <i className="fas fa-arrow-left mr-2 group-hover:-translate-x-1 transition-transform"></i>{" "}
          Back to Calendar
        </button>

        {loadingDetails ? (
          <div className="flex justify-center py-12">
            <div className="loader"></div>
          </div>
        ) : raceDetails ? (
          <>
            <header className="mb-8 border-b border-neutral-800 pb-6">
              <div className="text-xs font-mono text-neutral-500 uppercase mb-2">
                Round {raceDetails.round} • {raceDetails.season}
              </div>
              <h1 className="text-3xl font-medium tracking-tight text-white mb-2">
                {raceDetails.raceName}
              </h1>
              <div className="flex items-center text-neutral-400 text-sm">
                <Flag
                  country={raceDetails.Circuit.Location.country}
                  className="w-4 h-auto mr-2 rounded shadow-sm"
                />
                {raceDetails.Circuit.circuitName}
              </div>
            </header>

            {/* Track Info Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="minimal-card p-0 overflow-hidden relative group h-64 md:h-auto">
                {circuitData.img ? (
                  <div className="absolute inset-0 bg-white p-4 flex items-center justify-center">
                    <img
                      src={circuitData.img}
                      className="max-w-full max-h-full object-contain mix-blend-multiply opacity-80"
                      alt="Track Layout"
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 text-neutral-700">
                    <i className="fas fa-road text-4xl"></i>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-neutral-900/90 backdrop-blur-md p-4 border-t border-neutral-800">
                  <div className="flex justify-between items-start text-xs">
                    <div>
                      <div className="text-neutral-500 uppercase mb-1">
                        Lap Record
                      </div>
                      <div className="text-white font-mono">
                        {circuitData.record}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-neutral-500 uppercase mb-1">
                        Most Wins
                      </div>
                      <div className="text-white">{circuitData.mostWins}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fastest Lap Card */}
              {(() => {
                const fl = raceDetails.Results?.find(
                  (r) => r.FastestLap?.rank === "1"
                );
                if (fl && fl.FastestLap) {
                  return (
                    <div className="minimal-card p-6 flex flex-col justify-center bg-neutral-900/20 border-l-4 border-l-purple-500 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                        <i className="fas fa-stopwatch text-6xl"></i>
                      </div>
                      <div className="text-purple-400 font-bold uppercase tracking-wider text-xs mb-2">
                        Fastest Lap
                      </div>
                      <div className="text-4xl font-mono text-white tracking-tighter mb-4">
                        {fl.FastestLap.Time.time}
                      </div>
                      <div className="flex items-center">
                        <div
                          className="w-1 h-8 rounded-full mr-3"
                          style={{
                            backgroundColor: getTeamHex(
                              fl.Constructor.constructorId
                            ),
                          }}
                        ></div>
                        <div>
                          <div className="font-bold text-white text-lg">
                            {fl.Driver.givenName} {fl.Driver.familyName}
                          </div>
                          <div className="text-xs text-neutral-500 flex items-center space-x-2">
                            <span>{fl.Constructor.name}</span>
                            <span>•</span>
                            <span>Lap {fl.FastestLap.lap}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="minimal-card p-6 flex items-center justify-center text-neutral-500">
                    Fastest lap data unavailable
                  </div>
                );
              })()}
            </div>

            {/* Detailed Results List */}
            <div className="mb-12">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4">
                Full Race Results
              </h3>
              <div className="space-y-3">
                {raceDetails.Results?.map((res) => {
                  const grid = parseInt(res.grid);
                  const pos = parseInt(res.position);
                  const diff = grid === 0 ? 0 : grid - pos;
                  const isDNF =
                    res.positionText === "R" ||
                    res.positionText === "W" ||
                    isNaN(pos);
                  const stops = pitStops.filter(
                    (p) => p.driverId === res.Driver.driverId
                  ).length;
                  const hasFastestLap = res.FastestLap?.rank === "1";

                  return (
                    <div
                      key={res.position}
                      className="minimal-card p-4 flex flex-col md:flex-row items-center justify-between hover:border-neutral-600 transition-colors bg-neutral-900/10 group"
                    >
                      <div className="flex items-center w-full md:w-auto mb-4 md:mb-0">
                        <div className="flex-shrink-0 w-12 text-center font-mono text-xl font-bold text-neutral-500">
                          {res.positionText}
                        </div>
                        <div
                          className="w-1 h-10 rounded-full mx-4"
                          style={{
                            backgroundColor: getTeamHex(
                              res.Constructor.constructorId
                            ),
                          }}
                        ></div>
                        <div>
                          <div className="font-bold text-white text-lg flex items-center">
                            {res.Driver.givenName} {res.Driver.familyName}
                            <Flag
                              country={res.Driver.nationality}
                              className="ml-3 w-4 h-auto opacity-50 rounded-[1px]"
                            />
                          </div>
                          <div className="text-sm text-neutral-400">
                            {res.Constructor.name}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between w-full md:w-auto md:space-x-8 border-t md:border-t-0 border-neutral-800 pt-3 md:pt-0">
                        {/* Time / Status */}
                        <div className="text-center md:text-right min-w-[80px]">
                          <div className="text-[10px] text-neutral-600 uppercase mb-0.5">
                            Time
                          </div>
                          <div className="font-mono text-sm text-neutral-300">
                            {isDNF ? (
                              <span className="text-red-500">{res.status}</span>
                            ) : (
                              res.Time?.time || res.status
                            )}
                          </div>
                        </div>

                        {/* Pts */}
                        <div className="text-center md:text-right min-w-[40px]">
                          <div className="text-[10px] text-neutral-600 uppercase mb-0.5">
                            Pts
                          </div>
                          <div
                            className={`font-mono text-sm font-bold ${
                              parseInt(res.points) > 0
                                ? "text-white"
                                : "text-neutral-600"
                            }`}
                          >
                            +{res.points}
                          </div>
                        </div>

                        {/* Grid Change */}
                        <div className="text-center md:text-right min-w-[40px]">
                          <div className="text-[10px] text-neutral-600 uppercase mb-0.5">
                            Grid
                          </div>
                          <div className="flex items-center justify-center md:justify-end space-x-1">
                            <span className="text-neutral-500 font-mono text-xs">
                              {grid === 0 ? "PL" : grid}
                            </span>
                            {!isDNF &&
                              grid !== 0 &&
                              (diff > 0 ? (
                                <i className="fas fa-caret-up text-green-500"></i>
                              ) : diff < 0 ? (
                                <i className="fas fa-caret-down text-red-500"></i>
                              ) : (
                                <span className="text-neutral-700">-</span>
                              ))}
                          </div>
                        </div>

                        {/* Pit Stops */}
                        <div className="text-center md:text-right min-w-[40px]">
                          <div className="text-[10px] text-neutral-600 uppercase mb-0.5">
                            Stops
                          </div>
                          <div className="text-sm font-mono text-neutral-400">
                            {stops > 0 ? stops : "-"}
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="w-8 flex justify-end">
                          {hasFastestLap && (
                            <i
                              className="fas fa-stopwatch text-purple-500"
                              title="Fastest Lap"
                            ></i>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-neutral-500 flex flex-col items-center">
            <i className="fas fa-flag text-2xl mb-2 opacity-50"></i>
            <p>Full race results not available yet.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 md:p-16 max-w-5xl mx-auto h-screen overflow-y-auto fade-in pb-24">
      <header className="mb-8 border-b border-neutral-800 pb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-white mb-1">
            Calendar
          </h1>
          <p className="text-neutral-500 text-sm">{year} Season Schedule</p>
        </div>
        <div className="relative group">
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="appearance-none bg-neutral-900 border border-neutral-800 text-white font-mono text-sm hover:border-neutral-600 focus:border-neutral-500 transition-colors cursor-pointer outline-none rounded-lg px-4 py-2 pr-10"
          >
            {years.map((y) => (
              <option
                key={y}
                value={y}
                className="bg-neutral-900 text-neutral-300"
              >
                {y}
              </option>
            ))}
          </select>
          <i className="fas fa-chevron-down text-[10px] text-neutral-500 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none group-hover:text-neutral-400"></i>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {races.map((r) => {
          const raceDate = new Date(`${r.date}T${r.time}`);
          const isPast = year < currentYear || raceDate < new Date();
          const month = raceDate.toLocaleString("default", { month: "short" });
          const day = raceDate.getDate();

          const raceTime = formatDateLocal(r.date, r.time);
          const raceDisplay =
            raceTime === "TBA" ? "TBA" : raceTime.split(" ")[1];

          return (
            <div
              key={r.round}
              onClick={() => isPast && handleRaceClick(r)}
              className={`minimal-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between ${
                isPast
                  ? "hover:bg-neutral-900/50 cursor-pointer transition-colors group"
                  : "opacity-80"
              }`}
            >
              <div className="flex items-center space-x-6 mb-4 md:mb-0">
                <div className="text-center w-12 shrink-0">
                  <div className="text-xs text-neutral-500 uppercase font-mono mb-1">
                    R{r.round}
                  </div>
                  <div className="text-2xl font-bold text-white leading-none mb-1">
                    {day}
                  </div>
                  <div className="text-xs text-neutral-500 uppercase">
                    {month}
                  </div>
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Flag
                      country={r.Circuit.Location.country}
                      className="w-5 h-auto rounded shadow-sm"
                    />
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                      {r.raceName}
                    </h3>
                  </div>
                  <div className="text-sm text-neutral-500">
                    {r.Circuit.circuitName}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end border-t border-neutral-800 md:border-t-0 pt-4 md:pt-0">
                {r.Sprint && (
                  <div className="text-right hidden sm:block">
                    <div className="text-[10px] text-neutral-500 uppercase mb-0.5">
                      Sprint
                    </div>
                    <div className="text-sm font-mono text-neutral-300">
                      {(() => {
                        const t = formatDateLocal(r.Sprint.date, r.Sprint.time);
                        return t === "TBA" ? "TBA" : t.split(" ")[1];
                      })()}
                    </div>
                  </div>
                )}
                <div className="text-right hidden sm:block">
                  <div className="text-[10px] text-neutral-500 uppercase mb-0.5">
                    Qualifying
                  </div>
                  <div className="text-sm font-mono text-neutral-300">
                    {r.Qualifying
                      ? (() => {
                          const t = formatDateLocal(
                            r.Qualifying.date,
                            r.Qualifying.time
                          );
                          return t === "TBA" ? "TBA" : t.split(" ")[1];
                        })()
                      : "-"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-neutral-500 uppercase mb-0.5">
                    Race
                  </div>
                  <div className="text-sm font-mono text-white font-bold">
                    {raceDisplay}
                  </div>
                </div>
                <div className="w-16 text-right">
                  {isPast ? (
                    <span className="text-[10px] bg-neutral-800 text-neutral-500 px-2 py-1 rounded font-bold group-hover:bg-neutral-700 transition-colors">
                      RESULTS
                    </span>
                  ) : (
                    <span className="text-[10px] bg-white text-black px-2 py-1 rounded font-bold">
                      NEXT
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
