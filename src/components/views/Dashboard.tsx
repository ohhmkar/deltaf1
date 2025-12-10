import React, { useState, useEffect } from "react";
import { fetchData } from "../../services/api";
import { getTeamHex, formatDateLocal } from "../../utils/helpers";
import { TeamLogo, Flag } from "../shared";
import type { Race, DriverStanding, ConstructorStanding } from "../../types";

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [nextRace, setNextRace] = useState<Race | null>(null);
  const [lastRace, setLastRace] = useState<Race | null>(null);
  const [standings, setStandings] = useState<{
    drivers: DriverStanding[];
    constructors: ConstructorStanding[];
  } | null>(null);
  const [seasonProgress, setSeasonProgress] = useState({
    completed: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<string>("");
  const [onThisDay, setOnThisDay] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const data = await fetchData("/current.json");
      if (data) {
        const races: Race[] = data.RaceTable.Races;
        const now = new Date();
        const upcoming = races.find((r) => {
          if (!r.date || !r.time) return false;
          return new Date(`${r.date}T${r.time}`) > now;
        });
        const past = [...races].reverse().find((r) => {
          if (!r.date || !r.time) return false;
          return new Date(`${r.date}T${r.time}`) < now;
        });

        const completedRaces = races.filter((r) => {
          if (!r.date || !r.time) return false;
          return new Date(`${r.date}T${r.time}`) < now;
        }).length;
        setSeasonProgress({ completed: completedRaces, total: races.length });

        setNextRace(upcoming || null);

        if (past) {
          const resultsData = await fetchData(
            `/${past.season}/${past.round}/results.json`
          );
          if (resultsData && resultsData.RaceTable.Races[0]) {
            setLastRace(resultsData.RaceTable.Races[0]);
          }
        }

        const dData = await fetchData("/current/driverStandings.json");
        const cData = await fetchData("/current/constructorStandings.json");

        setStandings({
          drivers:
            dData?.StandingsTable?.StandingsLists[0]?.DriverStandings.slice(
              0,
              5
            ) || [],
          constructors:
            cData?.StandingsTable?.StandingsLists[0]?.ConstructorStandings.slice(
              0,
              5
            ) || [],
        });
        const facts = [
          "The first F1 race was held at Silverstone in 1950.",
          "Ferrari is the oldest and most successful team in F1 history.",
          "Lewis Hamilton and Michael Schumacher share the record for most championships (7).",
          "Max Verstappen is the youngest driver to start a Formula 1 race (17 years old).",
          "The 2024 season features a record-breaking 24 races.",
        ];
        setOnThisDay(facts[Math.floor(Math.random() * facts.length)]);
      }
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!nextRace || !nextRace.date || !nextRace.time) return;
    const interval = setInterval(() => {
      const raceDate = new Date(`${nextRace.date}T${nextRace.time}`);
      const now = new Date();
      if (isNaN(raceDate.getTime())) {
        setCountdown("TBA");
        return;
      }
      const diff = raceDate.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown("STARTED");
        return;
      }
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown(`${d}D ${h}H ${m}M ${s}S`);
    }, 1000);
    return () => clearInterval(interval);
  }, [nextRace]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-full">
        <div className="loader"></div>
      </div>
    );

  return (
    <div className="p-6 md:p-16 max-w-7xl mx-auto fade-in pb-24 md:pb-12 h-screen overflow-y-auto">
      <header className="mb-12 border-b border-neutral-800 pb-6">
        <h1 className="text-2xl font-medium tracking-tight text-white mb-1">
          Dashboard
        </h1>
        <p className="text-neutral-500 text-sm">
          Overview of the current F1 Season
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="minimal-card p-8 flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                <h2 className="text-xs font-mono uppercase text-neutral-400 tracking-wider">
                  Up Next
                </h2>
              </div>
              {nextRace && (
                <span className="text-xs font-mono text-neutral-500">
                  R{nextRace.round}
                </span>
              )}
            </div>
            {nextRace ? (
              <>
                <h3 className="text-3xl font-medium text-white mb-2">
                  {nextRace.raceName}
                </h3>
                <p className="text-lg text-neutral-400 font-light flex items-center">
                  {nextRace.Circuit.circuitName}
                </p>
                <div className="mt-2 text-sm text-neutral-500 flex items-center">
                  <Flag
                    country={nextRace.Circuit.Location.country}
                    className="w-5 h-auto mr-2 rounded-[2px]"
                  />
                  {nextRace.Circuit.Location.locality},{" "}
                  {nextRace.Circuit.Location.country}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-2 text-xs font-mono text-neutral-400 border-t border-neutral-800/50 pt-4">
                  {nextRace.FirstPractice && (
                    <div className="flex justify-between">
                      <span>FP1</span>
                      <span className="text-white">
                        {formatDateLocal(
                          nextRace.FirstPractice.date,
                          nextRace.FirstPractice.time
                        )}
                      </span>
                    </div>
                  )}
                  {nextRace.Sprint && (
                    <div className="flex justify-between text-yellow-500">
                      <span>Sprint</span>
                      <span className="text-white">
                        {formatDateLocal(
                          nextRace.Sprint.date,
                          nextRace.Sprint.time
                        )}
                      </span>
                    </div>
                  )}
                  {nextRace.Qualifying && (
                    <div className="flex justify-between text-neutral-300">
                      <span>Quali</span>
                      <span className="text-white">
                        {formatDateLocal(
                          nextRace.Qualifying.date,
                          nextRace.Qualifying.time
                        )}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-red-500">
                    <span>Race</span>
                    <span className="text-white">
                      {formatDateLocal(nextRace.date, nextRace.time)}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-neutral-500">Season Completed</div>
            )}
          </div>
          {nextRace && (
            <div className="mt-8">
              <div className="text-4xl md:text-5xl font-mono text-white tracking-tighter">
                {countdown}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="minimal-card p-6 flex-1">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xs font-mono uppercase text-neutral-400 tracking-wider">
                Previous Race
              </h2>
              <button
                onClick={() => onNavigate("season")}
                className="text-xs text-neutral-400 hover:text-white transition-colors"
              >
                View Details &rarr;
              </button>
            </div>
            {lastRace && lastRace.Results ? (
              <div>
                <h3 className="text-xl font-medium text-white mb-6">
                  {lastRace.raceName}
                </h3>
                <div className="space-y-4">
                  {lastRace.Results.slice(0, 3).map((res) => (
                    <div
                      key={res.position}
                      className="flex items-center justify-between relative"
                    >
                      <div className="flex items-center space-x-4">
                        <span className="font-mono text-neutral-600 text-sm w-4">
                          {res.position}
                        </span>
                        <div className="relative group/tooltip">
                          <div className="cursor-help">
                            <div className="text-sm font-medium text-neutral-200 flex items-center group-hover/tooltip:text-white transition-colors">
                              <Flag
                                country={res.Driver.nationality}
                                className="w-3.5 h-auto mr-2 opacity-75"
                              />
                              {res.Driver.givenName} {res.Driver.familyName}
                            </div>
                            <div className="text-xs text-neutral-500 flex items-center mt-1">
                              <span
                                className="w-1.5 h-1.5 rounded-full mr-2"
                                style={{
                                  backgroundColor: getTeamHex(
                                    res.Constructor.constructorId
                                  ),
                                }}
                              ></span>
                              {res.Constructor.name}
                            </div>
                          </div>

                          {/* Detailed Stats Tooltip */}
                          <div className="absolute bottom-full left-0 mb-2 w-48 bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl p-3 opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none z-50 backdrop-blur-md">
                            <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-2">
                              <span className="text-[10px] uppercase text-neutral-500 font-bold tracking-wider">
                                Race Data
                              </span>
                              <span className="text-[10px] font-mono text-neutral-400">
                                R{lastRace.round}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                              <div>
                                <div className="text-[9px] text-neutral-500 uppercase mb-0.5">
                                  Grid Start
                                </div>
                                <div className="text-xs text-white font-mono">
                                  P{res.grid}
                                </div>
                              </div>
                              <div>
                                <div className="text-[9px] text-neutral-500 uppercase mb-0.5">
                                  Fastest Lap
                                </div>
                                <div className="text-xs text-white font-mono">
                                  {res.FastestLap?.Time?.time || "-"}
                                </div>
                              </div>
                              <div>
                                <div className="text-[9px] text-neutral-500 uppercase mb-0.5">
                                  Points
                                </div>
                                <div className="text-xs text-yellow-500 font-mono font-bold">
                                  +{res.points}
                                </div>
                              </div>
                              <div>
                                <div className="text-[9px] text-neutral-500 uppercase mb-0.5">
                                  Status
                                </div>
                                <div className="text-xs text-neutral-300 font-mono truncate">
                                  {res.status}
                                </div>
                              </div>
                            </div>
                            {/* Arrow */}
                            <div className="absolute -bottom-1 left-4 w-2 h-2 bg-neutral-900 border-r border-b border-neutral-700 transform rotate-45"></div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm text-neutral-400">
                          {res.Time?.time || "N/A"}
                        </div>
                        <div className="text-[10px] text-neutral-600">
                          +{res.points} PTS
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-neutral-500 text-sm">No data available</div>
            )}
          </div>

          <div className="minimal-card p-5 border-neutral-800 bg-neutral-900/20 relative overflow-hidden flex flex-col justify-center min-h-[120px]">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <i className="fas fa-history text-4xl"></i>
            </div>
            <h2 className="text-xs font-mono uppercase text-neutral-400 tracking-wider mb-2">
              Did You Know?
            </h2>
            {onThisDay ? (
              <p className="text-xs text-neutral-300 leading-relaxed font-light italic">
                "{onThisDay}"
              </p>
            ) : (
              <div className="h-10 flex items-center">
                <div className="loader w-4 h-4"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
        <div className="minimal-card p-6">
          <div className="flex justify-between items-center mb-4 border-b border-neutral-800 pb-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">
              Top Drivers
            </h3>
            <button
              onClick={() => onNavigate("standings")}
              className="text-xs text-neutral-500 hover:text-white transition-colors"
            >
              View All &rarr;
            </button>
          </div>
          <div className="space-y-3">
            {standings?.drivers.map((d) => (
              <div
                key={d.Driver.driverId}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-mono text-neutral-500 w-4">
                    {d.position}
                  </span>
                  <div className="flex items-center">
                    <div
                      className="w-1 h-6 rounded-full mr-2"
                      style={{
                        backgroundColor: getTeamHex(
                          d.Constructors[0]?.constructorId || ""
                        ),
                      }}
                    ></div>
                    <div>
                      <div className="text-sm text-neutral-200 font-medium leading-none flex items-center">
                        {d.Driver.code}
                        <Flag
                          country={d.Driver.nationality}
                          className="ml-2 w-3 h-auto opacity-50"
                        />
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">
                        {d.wins} Wins
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-sm font-mono text-white font-bold">
                  {d.points}
                </div>
              </div>
            ))}
            {!standings && (
              <div className="text-neutral-600 text-xs">
                Loading standings...
              </div>
            )}
          </div>
        </div>

        <div className="minimal-card p-6">
          <div className="flex justify-between items-center mb-4 border-b border-neutral-800 pb-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">
              Top Teams
            </h3>
            <button
              onClick={() => onNavigate("standings")}
              className="text-xs text-neutral-500 hover:text-white transition-colors"
            >
              View All &rarr;
            </button>
          </div>
          <div className="space-y-3">
            {standings?.constructors.map((c) => (
              <div
                key={c.Constructor.constructorId}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-mono text-neutral-500 w-4">
                    {c.position}
                  </span>
                  <div className="flex items-center">
                    <TeamLogo
                      constructorId={c.Constructor.constructorId}
                      name={c.Constructor.name}
                    />
                    <div className="ml-2">
                      <div className="text-sm text-neutral-200 font-medium leading-none">
                        {c.Constructor.name}
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">
                        {c.wins} Wins
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-sm font-mono text-white font-bold">
                  {c.points}
                </div>
              </div>
            ))}
            {!standings && (
              <div className="text-neutral-600 text-xs">
                Loading standings...
              </div>
            )}
          </div>
        </div>

        <div className="minimal-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-6">
              Season Progress
            </h3>
            <div className="flex items-end space-x-2 mb-2">
              <span className="text-4xl font-mono text-white tracking-tighter">
                {seasonProgress.completed}
              </span>
              <span className="text-sm text-neutral-500 mb-1">
                / {seasonProgress.total} Races
              </span>
            </div>
            <div className="w-full bg-neutral-900 rounded-full h-2 mb-6">
              <div
                className="bg-white h-2 rounded-full transition-all duration-1000"
                style={{
                  width: `${
                    seasonProgress.total
                      ? (seasonProgress.completed / seasonProgress.total) * 100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              We are{" "}
              {seasonProgress.total
                ? Math.round(
                    (seasonProgress.completed / seasonProgress.total) * 100
                  )
                : 0}
              % through the {new Date().getFullYear()} season.
              {nextRace
                ? ` The next round is at ${nextRace.Circuit.Location.locality}.`
                : " The season has concluded."}
            </p>
          </div>
          <button
            onClick={() => onNavigate("season")}
            className="mt-4 w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs rounded transition-colors border border-neutral-800"
          >
            View Full Calendar
          </button>
        </div>
      </div>
    </div>
  );
};
