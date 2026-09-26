import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import { fetchData } from "../../../services/api";
import { getTeamHex, getCircuitData } from "../../../utils/helpers";
import { Flag, Spoiler, SkeletonCard } from "../../shared";
import type { Race, PitStop } from "../../../types";
import { Podium } from "./Podium";
import { ResultsTable } from "./ResultsTable";

// One race weekend: /season?year=&round= (opened from the Calendar or a link).
export const RacePage: React.FC<{
  year: number;
  round: string;
  races: Race[]; // the season's calendar, for previous/next
  onBack: () => void;
  onGo: (round: string) => void;
}> = ({ year, round, races, onBack, onGo }) => {
  const [raceDetails, setRaceDetails] = useState<Race | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [pitStops, setPitStops] = useState<PitStop[]>([]);

  useEffect(() => {
    let stale = false;
    setLoadingDetails(true);
    setRaceDetails(null);
    setPitStops([]);
    Promise.all([
      fetchData(`/${year}/${round}/results.json`),
      fetchData(`/${year}/${round}/pitstops.json?limit=100`),
    ])
      .then(([resData, pitData]) => {
        if (stale) return;
        setRaceDetails(resData?.RaceTable?.Races[0] ?? null);
        setPitStops(pitData?.RaceTable?.Races[0]?.PitStops ?? []);
      })
      .catch((e) => console.error(e))
      .finally(() => !stale && setLoadingDetails(false));
    return () => {
      stale = true;
    };
  }, [year, round]);

  const stopsByDriver: Record<string, number> = {};
  for (const p of pitStops) stopsByDriver[p.driverId] = (stopsByDriver[p.driverId] || 0) + 1;

  const circuitData = raceDetails
    ? getCircuitData(raceDetails.Circuit.circuitId)
    : { img: "", record: "N/A", mostWins: "N/A" };

  const idx = races.findIndex((r) => r.round === round);
  const prev = idx > 0 ? races[idx - 1] : null;
  const next = idx >= 0 && idx < races.length - 1 ? races[idx + 1] : null;
  const navBtn =
    "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors min-w-0";

  return (
    <div className="p-6 md:p-16 max-w-5xl mx-auto h-screen overflow-y-auto fade-in pb-24">
      <div className="mb-6 flex items-center justify-between gap-2">
        <button
          onClick={onBack}
          className="text-neutral-500 hover:text-white flex items-center transition-colors text-sm group shrink-0"
        >
          <i className="fas fa-arrow-left mr-2 group-hover:-translate-x-1 transition-transform"></i>{" "}
          Calendar
        </button>
        <nav aria-label="Other races" className="flex items-center gap-1 min-w-0">
          {prev && (
            <button onClick={() => onGo(prev.round)} className={navBtn} title={prev.raceName}>
              <i className="fas fa-chevron-left"></i>
              <span className="truncate hidden sm:inline">{prev.raceName.replace(" Grand Prix", " GP")}</span>
              <span className="sm:hidden">R{prev.round}</span>
            </button>
          )}
          {next && (
            <button onClick={() => onGo(next.round)} className={navBtn} title={next.raceName}>
              <span className="truncate hidden sm:inline">{next.raceName.replace(" Grand Prix", " GP")}</span>
              <span className="sm:hidden">R{next.round}</span>
              <i className="fas fa-chevron-right"></i>
            </button>
          )}
        </nav>
      </div>

      {loadingDetails ? (
        <div className="space-y-6">
          <SkeletonCard className="min-h-[120px]" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkeletonCard className="min-h-[220px]" />
            <SkeletonCard className="min-h-[220px]" />
          </div>
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
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 text-neutral-400 text-sm">
              <span className="flex items-center">
                <Flag
                  country={raceDetails.Circuit.Location.country}
                  className="w-4 h-auto mr-2 rounded shadow-sm"
                />
                {raceDetails.Circuit.circuitName}
              </span>
              {/* OpenF1 (Replay's source) covers 2023 on; matched by race date */}
              {parseInt(raceDetails.season) >= 2023 && (
                <Link
                  to={`/replay?year=${raceDetails.season}&date=${raceDetails.date}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-neutral-800 text-neutral-200 hover:bg-neutral-700 text-xs font-medium"
                >
                  <i className="fas fa-circle-play"></i> Watch replay
                </Link>
              )}
            </div>
          </header>

          {/* everything that gives the result away sits under one cover */}
          <Spoiler tall>
            <div className="space-y-8 mb-12">
              <Podium results={raceDetails.Results ?? []} />
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
              <section>
                <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4">
                  Full Race Results
                </h3>
                <ResultsTable results={raceDetails.Results ?? []} stopsByDriver={stopsByDriver} />
              </section>
            </div>
          </Spoiler>

          {/* Circuit */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
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
          </section>
        </>
      ) : (
        <div className="text-center py-12 text-neutral-500 flex flex-col items-center">
          <i className="fas fa-flag text-2xl mb-2 opacity-50"></i>
          <p>Full race results not available yet.</p>
        </div>
      )}
    </div>
  );
};
