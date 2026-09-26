import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import { fetchData } from "../../../services/api";
import { getTeamHex, getCircuitData } from "../../../utils/helpers";
import { Flag, Spoiler, SkeletonCard } from "../../shared";
import type { Race, PitStop } from "../../../types";

// One race weekend: /season?year=&round= (opened from the Calendar or a link).
export const RacePage: React.FC<{
  year: number;
  round: string;
  onBack: () => void;
}> = ({ year, round, onBack }) => {
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

  const circuitData = raceDetails
    ? getCircuitData(raceDetails.Circuit.circuitId)
    : { img: "", record: "N/A", mostWins: "N/A" };

  return (
    <div className="p-6 md:p-16 max-w-5xl mx-auto h-screen overflow-y-auto fade-in pb-24">
      <button
        onClick={onBack}
        className="mb-6 text-neutral-500 hover:text-white flex items-center transition-colors text-sm group"
      >
        <i className="fas fa-arrow-left mr-2 group-hover:-translate-x-1 transition-transform"></i>{" "}
        Back to Calendar
      </button>

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
            <Spoiler>
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
            </Spoiler>
          </div>

          {/* Detailed Results List */}
          <div className="mb-12">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4">
              Full Race Results
            </h3>
            <Spoiler>
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
                              <span className="text-green-500 font-mono text-xs" title={`Gained ${diff} places`}>
                                ▲{diff}
                              </span>
                            ) : diff < 0 ? (
                              <span className="text-red-500 font-mono text-xs" title={`Lost ${-diff} places`}>
                                ▼{-diff}
                              </span>
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
            </Spoiler>
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
};
