import React, { useState, useEffect } from "react";
import { fetchData } from "../../services/api";
import {
  subscribeToStats,
  getCachedCareerStats,
  isStatsLoading,
} from "../../services/statsCache";
import { getTeamHex } from "../../utils/helpers";
import { TeamLogo, Flag } from "../shared";
import type {
  DriverStanding,
  ConstructorStanding,
  CareerStats,
} from "../../types";

export const Grid: React.FC = () => {
  const [tab, setTab] = useState<"lineups" | "drivers" | "teams">("lineups");
  const [teams, setTeams] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<DriverStanding[]>([]);
  const [constructors, setConstructors] = useState<ConstructorStanding[]>([]);
  const [careerStats, setCareerStats] = useState<Record<string, CareerStats>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(isStatsLoading());

  const currentYear = new Date().getFullYear();
  useEffect(() => {
    const cached = getCachedCareerStats();
    if (cached) {
      setCareerStats(cached.data);
      setStatsLoading(false);
    }

    const unsubscribe = subscribeToStats((stats) => {
      if (stats) {
        setCareerStats(stats.data);
        setStatsLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [cData, dData] = await Promise.all([
          fetchData("/current/constructorStandings.json"),
          fetchData("/current/driverStandings.json"),
        ]);

        const driverList: DriverStanding[] =
          dData?.StandingsTable?.StandingsLists[0]?.DriverStandings || [];
        const teamList: ConstructorStanding[] =
          cData?.StandingsTable?.StandingsLists[0]?.ConstructorStandings || [];

        setDrivers(driverList);
        setConstructors(teamList);

        // Format teams for lineups view
        if (
          cData?.StandingsTable?.StandingsLists[0] &&
          dData?.StandingsTable?.StandingsLists[0]
        ) {
          const constructorsList =
            cData.StandingsTable.StandingsLists[0].ConstructorStandings;
          const driversList =
            dData.StandingsTable.StandingsLists[0].DriverStandings;

          const formattedTeams = constructorsList.map((c: any) => {
            const teamDrivers = driversList.filter(
              (d: any) =>
                d.Constructors &&
                d.Constructors[0] &&
                d.Constructors[0].constructorId === c.Constructor.constructorId
            );
            return {
              id: c.Constructor.constructorId,
              name: c.Constructor.name,
              nationality: c.Constructor.nationality,
              drivers: teamDrivers.map((d: any) => ({
                name: `${d.Driver.givenName} ${d.Driver.familyName}`,
                code: d.Driver.code,
                number: d.Driver.permanentNumber,
                nationality: d.Driver.nationality,
                points: d.points,
                wins: d.wins,
              })),
            };
          });
          setTeams(formattedTeams);
        }
        // Career stats are now loaded via statsCache service (preloaded on app startup)
      } catch (e) {
        console.error("Grid Load Error", e);
      }
      setLoading(false);
    };
    load();
  }, []);

  const renderStars = (count: number, defending: boolean) => {
    if (count === 0 && !defending) return null;
    return (
      <div className="flex gap-1 mt-2 flex-wrap">
        {defending && (
          <i
            className="fas fa-star text-yellow-500 text-sm"
            title="Defending Champion"
          ></i>
        )}
        {Array.from({ length: defending ? count - 1 : count }).map((_, i) => (
          <i
            key={i}
            className="fas fa-star text-white text-sm"
            title="World Champion"
          ></i>
        ))}
      </div>
    );
  };

  const renderLineups = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-24">
      {teams.map((team) => (
        <div
          key={team.id}
          className="minimal-card p-5 border border-neutral-800 bg-neutral-900/30 hover:border-neutral-700 transition-colors group"
        >
          <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-3">
            <div className="flex items-center space-x-3">
              <div
                className="w-1 h-6 rounded-full"
                style={{ backgroundColor: getTeamHex(team.id) }}
              ></div>
              <h3 className="font-bold text-white text-lg">{team.name}</h3>
            </div>
            <Flag
              country={team.nationality}
              className="w-5 h-auto opacity-50 grayscale group-hover:grayscale-0 transition-all"
            />
          </div>
          <div className="space-y-3">
            {team.drivers.length > 0 ? (
              team.drivers.map((driver: any) => (
                <div
                  key={driver.code}
                  className="flex justify-between items-center bg-neutral-950/30 p-2 rounded border border-white/5"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-neutral-500 font-mono w-6 text-right text-sm">
                      {driver.number}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm text-neutral-200 font-medium leading-none mb-0.5">
                        {driver.name}
                      </span>
                      <div className="flex items-center text-[10px] text-neutral-500">
                        <Flag
                          country={driver.nationality}
                          className="w-3 h-auto mr-1 opacity-60"
                        />
                        {driver.nationality}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono text-white bg-neutral-800 px-2 py-0.5 rounded inline-block">
                      {driver.points} PTS
                    </div>
                    {parseInt(driver.wins) > 0 && (
                      <div className="text-[9px] text-yellow-600 mt-0.5">
                        {driver.wins} Wins
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-xs text-neutral-600 py-4 italic">
                No drivers confirmed in standings
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderDriverStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24">
      {drivers.map((d) => {
        const stats = careerStats[d.Driver.driverId] || {
          wins: 0,
          poles: 0,
          championships: 0,
          defending: false,
        };
        const teamColor = getTeamHex(d.Constructors[0]?.constructorId || "");

        return (
          <div
            key={d.Driver.driverId}
            className="minimal-card bg-neutral-900/20 overflow-hidden relative group hover:border-neutral-600 transition-all duration-300"
          >
            <div
              className="absolute top-0 w-full h-1"
              style={{ backgroundColor: teamColor }}
            ></div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="text-3xl font-bold text-neutral-800 group-hover:text-neutral-700 transition-colors font-mono select-none absolute top-4 right-4">
                  {d.Driver.permanentNumber}
                </div>
                <Flag
                  country={d.Driver.nationality}
                  className="w-6 h-auto rounded shadow-sm"
                />
              </div>

              <div className="relative z-10">
                <h3 className="text-xl font-bold text-white leading-tight mb-1">
                  {d.Driver.givenName} <br /> {d.Driver.familyName}
                </h3>
                <div className="text-xs text-neutral-500 uppercase tracking-wider mb-4">
                  {d.Constructors[0]?.name}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-6 border-t border-neutral-800/50 pt-4">
                  <div>
                    <div className="text-[10px] text-neutral-500 uppercase">
                      Wins
                    </div>
                    <div className="text-lg font-mono text-white">
                      {stats.wins}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-500 uppercase">
                      Poles
                    </div>
                    <div className="text-lg font-mono text-white">
                      {stats.poles}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-500 uppercase">
                      Titles
                    </div>
                    <div className="text-lg font-mono text-white">
                      {stats.championships}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderTeamStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24">
      {constructors.map((c) => {
        const stats = careerStats[c.Constructor.constructorId] || {
          wins: 0,
          poles: 0,
          championships: 0,
          defending: false,
        };
        const teamColor = getTeamHex(c.Constructor.constructorId);

        return (
          <div
            key={c.Constructor.constructorId}
            className="minimal-card bg-neutral-900/20 overflow-hidden relative group hover:border-neutral-600 transition-all duration-300"
          >
            <div
              className="absolute top-0 w-full h-1"
              style={{ backgroundColor: teamColor }}
            ></div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <TeamLogo
                  constructorId={c.Constructor.constructorId}
                  name={c.Constructor.name}
                />
                <Flag
                  country={c.Constructor.nationality}
                  className="w-5 h-auto opacity-50"
                />
              </div>

              <h3 className="text-xl font-bold text-white mb-2">
                {c.Constructor.name}
              </h3>

              {renderStars(stats.championships, stats.defending)}

              <div className="grid grid-cols-3 gap-2 mt-6 border-t border-neutral-800/50 pt-4">
                <div>
                  <div className="text-[10px] text-neutral-500 uppercase">
                    Wins
                  </div>
                  <div className="text-lg font-mono text-white">
                    {stats.wins}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-neutral-500 uppercase">
                    Poles
                  </div>
                  <div className="text-lg font-mono text-white">
                    {stats.poles}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-neutral-500 uppercase">
                    Titles
                  </div>
                  <div className="text-lg font-mono text-white">
                    {stats.championships}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="p-6 md:p-16 max-w-7xl mx-auto h-screen overflow-y-auto fade-in pb-24">
      <header className="mb-8 border-b border-neutral-800 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-white mb-1">
            The Grid
          </h1>
          <p className="text-neutral-500 text-sm">
            {currentYear} Drivers & Constructors
          </p>
        </div>
        <div className="flex space-x-4 mt-4 md:mt-0">
          <button
            onClick={() => setTab("lineups")}
            className={`px-4 py-2 text-sm rounded transition-colors ${
              tab === "lineups"
                ? "bg-white text-black font-medium"
                : "text-neutral-500 hover:text-white"
            }`}
          >
            Team Lineups
          </button>
          <button
            onClick={() => setTab("drivers")}
            className={`px-4 py-2 text-sm rounded transition-colors ${
              tab === "drivers"
                ? "bg-white text-black font-medium"
                : "text-neutral-500 hover:text-white"
            }`}
          >
            Driver Stats
          </button>
          <button
            onClick={() => setTab("teams")}
            className={`px-4 py-2 text-sm rounded transition-colors ${
              tab === "teams"
                ? "bg-white text-black font-medium"
                : "text-neutral-500 hover:text-white"
            }`}
          >
            Team Stats
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center p-24">
          <div className="loader"></div>
        </div>
      ) : (
        <>
          {tab === "lineups" && renderLineups()}
          {tab === "drivers" && (
            <>
              {statsLoading && (
                <div className="mb-4 px-3 py-2 bg-neutral-800/50 rounded-lg text-sm text-neutral-400 flex items-center gap-2">
                  <div className="loader-small"></div>
                  Loading career stats in background...
                </div>
              )}
              {renderDriverStats()}
            </>
          )}
          {tab === "teams" && (
            <>
              {statsLoading && (
                <div className="mb-4 px-3 py-2 bg-neutral-800/50 rounded-lg text-sm text-neutral-400 flex items-center gap-2">
                  <div className="loader-small"></div>
                  Loading career stats in background...
                </div>
              )}
              {renderTeamStats()}
            </>
          )}
        </>
      )}
    </div>
  );
};
