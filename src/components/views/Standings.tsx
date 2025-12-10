import React, { useState, useEffect } from "react";
import { fetchData } from "../../services/api";
import { getTeamHex } from "../../utils/helpers";
import { TeamLogo, Flag } from "../shared";
import type { DriverStanding, ConstructorStanding } from "../../types";

export const Standings: React.FC = () => {
  const [type, setType] = useState<"drivers" | "constructors" | "teammate">(
    "drivers"
  );
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [drivers, setDrivers] = useState<DriverStanding[]>([]);
  const [constructors, setConstructors] = useState<ConstructorStanding[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDriver, setSelectedDriver] = useState<DriverStanding | null>(
    null
  );
  const [driverResults, setDriverResults] = useState<any[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);

  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const years = Array.from(
    { length: currentYear - 1950 + 1 },
    (_, i) => currentYear - i
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setDrivers([]);
      setConstructors([]);
      setSelectedIds([]);
      setIsCompareMode(false);
      try {
        const dData = await fetchData(`/${year}/driverStandings.json`);
        if (dData && dData.StandingsTable.StandingsLists.length > 0) {
          setDrivers(dData.StandingsTable.StandingsLists[0].DriverStandings);
        }

        const cData = await fetchData(`/${year}/constructorStandings.json`);
        if (cData && cData.StandingsTable.StandingsLists.length > 0) {
          setConstructors(
            cData.StandingsTable.StandingsLists[0].ConstructorStandings
          );
        }
      } catch (e) {
        console.error("Error fetching standings", e);
      }
      setLoading(false);
    };
    load();
  }, [year]);

  const handleRowClick = async (item: DriverStanding | ConstructorStanding) => {
    const id =
      "Driver" in item ? item.Driver.driverId : item.Constructor.constructorId;

    if (isCompareMode) {
      if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter((x) => x !== id));
      } else {
        if (selectedIds.length >= 5) return;
        setSelectedIds([...selectedIds, id]);
      }
      return;
    }

    if ("Driver" in item) {
      setSelectedDriver(item as DriverStanding);
      setResultsLoading(true);
      try {
        const data = await fetchData(
          `/${year}/drivers/${item.Driver.driverId}/results.json`
        );
        if (data && data.RaceTable && data.RaceTable.Races) {
          setDriverResults(data.RaceTable.Races);
        } else {
          setDriverResults([]);
        }
      } catch (e) {
        console.error(e);
        setDriverResults([]);
      }
      setResultsLoading(false);
    }
  };

  const handleCompare = async () => {
    setShowCompareModal(true);
    setIsComparing(true);
    setComparisonData([]);
    try {
      const promises = selectedIds.map((id) => {
        return fetchData(`/${year}/drivers/${id}/results.json`);
      });

      const results = await Promise.all(promises);
      const formatted = results.map((r, i) => {
        const id = selectedIds[i];
        let meta: any = {};
        const d = drivers.find((x) => x.Driver.driverId === id);
        if (d) {
          const teamId = d?.Constructors?.[0]?.constructorId || "";
          meta = {
            name: d?.Driver.familyName,
            color: getTeamHex(teamId),
            code: d?.Driver.code,
          };
        } else {
          const c = constructors.find(
            (x) => x.Constructor.constructorId === id
          );
          meta = {
            name: c?.Constructor.name,
            color: getTeamHex(id),
            code: c?.Constructor.name.substring(0, 3).toUpperCase(),
          };
        }

        const races = r?.RaceTable?.Races || [];
        let cumulative = 0;
        const points = races.map((race: any) => {
          const pts = parseFloat(race.Results[0].points);
          cumulative += pts;
          return {
            round: parseInt(race.round),
            cumulative,
            points: pts,
            pos: parseInt(race.Results[0].position),
          };
        });

        return {
          id,
          ...meta,
          data: points,
          totalWins: races.filter((x: any) => x.Results[0].position === "1")
            .length,
          totalPodiums: races.filter(
            (x: any) => parseInt(x.Results[0].position) <= 3
          ).length,
        };
      });
      setComparisonData(formatted);
    } catch (e) {
      console.error(e);
    }
    setIsComparing(false);
  };

  const renderComparisonChart = () => {
    if (isComparing)
      return (
        <div className="h-64 flex items-center justify-center">
          <div className="loader"></div>
        </div>
      );
    if (comparisonData.length === 0) return null;

    const w = 600;
    const h = 300;
    const padding = 40;

    const maxRound = Math.max(
      ...comparisonData.flatMap((d) => d.data.map((p: any) => p.round)),
      10
    );
    const maxPoints = Math.max(
      ...comparisonData.flatMap((d) => d.data.map((p: any) => p.cumulative)),
      10
    );

    const getX = (round: number) =>
      padding + (round / maxRound) * (w - 2 * padding);
    const getY = (pts: number) =>
      h - padding - (pts / maxPoints) * (h - 2 * padding);

    return (
      <div className="w-full h-full relative">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="w-full h-full overflow-visible"
        >
          <line
            x1={padding}
            y1={h - padding}
            x2={w - padding}
            y2={h - padding}
            stroke="#404040"
            strokeWidth="1"
          />
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={h - padding}
            stroke="#404040"
            strokeWidth="1"
          />
          <text
            x={w / 2}
            y={h - 5}
            textAnchor="middle"
            fill="#737373"
            fontSize="10"
            fontFamily="monospace"
          >
            ROUND
          </text>
          <text
            x={10}
            y={h / 2}
            transform={`rotate(-90 10 ${h / 2})`}
            textAnchor="middle"
            fill="#737373"
            fontSize="10"
            fontFamily="monospace"
          >
            POINTS
          </text>

          {comparisonData.map((series) => {
            if (!series.data || series.data.length === 0) return null;

            let d = `M ${getX(0)} ${getY(0)}`;
            series.data.forEach((p: any) => {
              d += ` L ${getX(p.round)} ${getY(p.cumulative)}`;
            });

            const lastPoint = series.data[series.data.length - 1];

            return (
              <g key={series.id}>
                <path d={d} fill="none" stroke={series.color} strokeWidth="2" />
                {series.data.map((p: any, i: number) => (
                  <circle
                    key={i}
                    cx={getX(p.round)}
                    cy={getY(p.cumulative)}
                    r="3"
                    fill="#171717"
                    stroke={series.color}
                    strokeWidth="1.5"
                  />
                ))}
                <text
                  x={getX(lastPoint.round) + 5}
                  y={getY(lastPoint.cumulative)}
                  fill={series.color}
                  fontSize="10"
                  alignmentBaseline="middle"
                  fontWeight="bold"
                >
                  {series.code}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  const renderStatsComparison = () => {
    if (comparisonData.length === 0) return null;
    const maxVal = Math.max(
      ...comparisonData.map((d) => Math.max(d.totalWins, d.totalPodiums)),
      1
    );

    return (
      <div className="space-y-4">
        {comparisonData.map((d) => (
          <div key={d.id} className="flex items-center space-x-4">
            <div className="w-16 text-xs text-right text-neutral-400 font-mono truncate">
              {d.name}
            </div>
            <div className="flex-1 bg-neutral-800/50 rounded h-16 relative flex flex-col justify-center px-2 space-y-2">
              <div className="flex items-center">
                <div
                  className="h-2 rounded-full bg-yellow-500"
                  style={{
                    width: `${(d.totalWins / maxVal) * 80}%`,
                    minWidth: d.totalWins > 0 ? "4px" : "0",
                  }}
                ></div>
                <span className="ml-2 text-[10px] text-neutral-500">
                  {d.totalWins} Wins
                </span>
              </div>
              <div className="flex items-center">
                <div
                  className="h-2 rounded-full bg-neutral-400"
                  style={{
                    width: `${(d.totalPodiums / maxVal) * 80}%`,
                    minWidth: d.totalPodiums > 0 ? "4px" : "0",
                  }}
                ></div>
                <span className="ml-2 text-[10px] text-neutral-500">
                  {d.totalPodiums} Pods
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderFormChart = () => {
    if (resultsLoading)
      return (
        <div className="h-24 flex items-center justify-center">
          <div className="loader w-6 h-6"></div>
        </div>
      );
    if (driverResults.length === 0)
      return (
        <div className="text-neutral-600 text-xs w-full text-center h-24 flex items-center justify-center">
          No race data available
        </div>
      );

    const last10 = driverResults.slice(-10);
    const points = last10.map((r, i) => {
      const posText = r.Results[0].positionText;
      const pos =
        posText === "R" || posText === "W"
          ? 22
          : parseInt(r.Results[0].position);
      return { x: i, y: pos, label: posText === "R" ? "DNF" : pos };
    });

    const w = 300;
    const h = 80;
    const xStep = w / (points.length - 1 || 1);

    let pathD = "";
    points.forEach((p, i) => {
      const y = (p.y / 22) * h;
      pathD += i === 0 ? `M ${i * xStep} ${y}` : ` L ${i * xStep} ${y}`;
    });

    const areaD = pathD + ` L ${(points.length - 1) * xStep} ${h} L 0 ${h} Z`;
    const color = selectedDriver?.Constructors[0]
      ? getTeamHex(selectedDriver.Constructors[0].constructorId)
      : "#fff";

    return (
      <div className="w-full h-32 relative mt-2 group">
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[8px] text-neutral-600 font-mono pointer-events-none py-1">
          <span>P1</span>
          <span>P10</span>
          <span>P20</span>
        </div>
        <div className="ml-6 h-full relative">
          <svg
            viewBox={`0 0 ${w} ${h}`}
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <line
              x1="0"
              y1={h * 0.45}
              x2={w}
              y2={h * 0.45}
              stroke="#262626"
              strokeWidth="0.5"
              strokeDasharray="2 2"
            />
            <line
              x1="0"
              y1={h * 0.9}
              x2={w}
              y2={h * 0.9}
              stroke="#262626"
              strokeWidth="0.5"
              strokeDasharray="2 2"
            />

            <path d={areaD} fill="url(#chartGrad)" stroke="none" />
            <path
              d={pathD}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points.map((p, i) => (
              <circle
                key={i}
                cx={i * xStep}
                cy={(p.y / 22) * h}
                r="3"
                fill="#171717"
                stroke={color}
                strokeWidth="2"
                className="transition-all duration-200"
              />
            ))}
          </svg>
          <div className="absolute inset-0 pointer-events-none">
            {points.map((p, i) => (
              <div
                key={i}
                className="absolute bottom-full mb-1 text-[10px] font-mono text-neutral-300 bg-neutral-900/90 border border-neutral-700 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-20"
                style={{
                  left: `${(i / (points.length - 1)) * 100}%`,
                  transform:
                    i === 0
                      ? "translateX(0)"
                      : i === points.length - 1
                      ? "translateX(-100%)"
                      : "translateX(-50%)",
                }}
              >
                {p.label === 22 ? "DNF" : `P${p.label}`}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderTeammateBattles = () => {
    const teamBattles: Record<string, DriverStanding[]> = {};
    drivers.forEach((d) => {
      const teamId = d.Constructors[0]?.constructorId;
      if (!teamId) return;
      if (!teamBattles[teamId]) teamBattles[teamId] = [];
      teamBattles[teamId].push(d);
    });

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
        {Object.entries(teamBattles).map(([teamId, teamDrivers]) => {
          const teamName = teamDrivers[0].Constructors[0].name;
          const color = getTeamHex(teamId);

          teamDrivers.sort(
            (a, b) => parseFloat(b.points) - parseFloat(a.points)
          );
          const maxPts = parseFloat(teamDrivers[0].points);

          return (
            <div
              key={teamId}
              className="minimal-card p-4 border border-neutral-800 bg-neutral-900/20"
            >
              <div className="flex items-center space-x-2 mb-4">
                <div
                  className="w-1 h-4 rounded-full"
                  style={{ backgroundColor: color }}
                ></div>
                <h3 className="font-bold text-white text-sm">{teamName}</h3>
              </div>
              <div className="space-y-4">
                {teamDrivers.map((d) => (
                  <div key={d.Driver.driverId} className="relative">
                    <div className="flex justify-between items-end mb-1 text-xs">
                      <div className="flex items-center font-medium text-neutral-200">
                        <span className="w-6 text-neutral-500 font-mono">
                          #{d.Driver.permanentNumber}
                        </span>
                        {d.Driver.code}
                      </div>
                      <div className="font-mono text-white">{d.points} PTS</div>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            (parseFloat(d.points) / (maxPts || 1)) * 100
                          }%`,
                          backgroundColor: color,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-6 md:p-16 max-w-5xl mx-auto h-screen overflow-y-auto fade-in">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-medium tracking-tight text-white">
            Standings
          </h2>
          <div className="relative group">
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="appearance-none bg-transparent text-neutral-400 font-mono text-lg hover:text-white focus:text-white transition-colors cursor-pointer outline-none pr-6 pl-2 py-1"
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
            <i className="fas fa-chevron-down text-[10px] text-neutral-600 absolute right-0 top-1/2 transform -translate-y-1/2 pointer-events-none group-hover:text-neutral-400"></i>
          </div>

          {type === "drivers" && (
            <button
              onClick={() => {
                setIsCompareMode(!isCompareMode);
                setSelectedIds([]);
              }}
              className={`ml-4 px-3 py-1 rounded text-xs font-medium border transition-all ${
                isCompareMode
                  ? "bg-white text-black border-white"
                  : "bg-transparent text-neutral-500 border-neutral-800 hover:text-white"
              }`}
            >
              {isCompareMode ? "Done Comparing" : "Compare"}
            </button>
          )}
        </div>

        <div className="flex space-x-6 text-sm">
          <button
            onClick={() => setType("drivers")}
            className={`pb-1 border-b-2 transition-all ${
              type === "drivers"
                ? "text-white border-white"
                : "text-neutral-500 border-transparent hover:text-neutral-300"
            }`}
          >
            Drivers
          </button>
          <button
            onClick={() => {
              setType("constructors");
              setIsCompareMode(false);
              setSelectedIds([]);
            }}
            className={`pb-1 border-b-2 transition-all ${
              type === "constructors"
                ? "text-white border-white"
                : "text-neutral-500 border-transparent hover:text-neutral-300"
            }`}
          >
            Constructors
          </button>
          <button
            onClick={() => {
              setType("teammate");
              setIsCompareMode(false);
              setSelectedIds([]);
            }}
            className={`pb-1 border-b-2 transition-all ${
              type === "teammate"
                ? "text-white border-white"
                : "text-neutral-500 border-transparent hover:text-neutral-300"
            }`}
          >
            Battles
          </button>
        </div>
      </div>

      {isCompareMode && type === "drivers" && (
        <div className="mb-4 text-xs text-neutral-500 font-mono animate-pulse">
          Select up to 5 items to compare performance.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="loader"></div>
        </div>
      ) : (
        <>
          {type === "teammate" ? (
            renderTeammateBattles()
          ) : type === "constructors" ? (
            <div className="space-y-3">
              {constructors.length === 0 && !loading && (
                <div className="p-8 text-center text-neutral-500">
                  Constructor championship data not available for {year}.
                </div>
              )}
              {constructors.map((c) => (
                <div
                  key={c.Constructor.constructorId}
                  className="flex items-center justify-between p-4 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-900/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-neutral-500 font-mono text-sm w-6">
                      {c.position}
                    </span>
                    <div
                      className="w-1 h-8 rounded-full"
                      style={{
                        backgroundColor: getTeamHex(
                          c.Constructor.constructorId
                        ),
                      }}
                    ></div>
                    <TeamLogo
                      constructorId={c.Constructor.constructorId}
                      name={c.Constructor.name}
                    />
                    <div>
                      <div className="font-medium text-white">
                        {c.Constructor.name}
                      </div>
                      <div className="text-xs text-neutral-500 flex items-center gap-1">
                        <Flag
                          country={c.Constructor.nationality}
                          className="w-3 h-auto"
                        />
                        {c.Constructor.nationality}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-xs text-neutral-500">Wins</div>
                      <div className="font-mono text-neutral-300">{c.wins}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-neutral-500">Points</div>
                      <div className="font-mono text-white text-lg">
                        {c.points}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {drivers.map((d) => (
                <div
                  key={d.Driver.driverId}
                  onClick={() => handleRowClick(d)}
                  className={`flex items-center justify-between p-4 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-900/30 transition-colors cursor-pointer ${
                    isCompareMode && selectedIds.includes(d.Driver.driverId)
                      ? "border-white/50 bg-neutral-800/50"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {isCompareMode ? (
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedIds.includes(d.Driver.driverId)
                            ? "bg-white border-white"
                            : "border-neutral-600"
                        }`}
                      >
                        {selectedIds.includes(d.Driver.driverId) && (
                          <i className="fas fa-check text-black text-xs"></i>
                        )}
                      </div>
                    ) : (
                      <span className="text-neutral-500 font-mono text-sm w-6">
                        {d.position}
                      </span>
                    )}
                    <div
                      className="w-1 h-8 rounded-full"
                      style={{
                        backgroundColor: getTeamHex(
                          d.Constructors[0]?.constructorId || ""
                        ),
                      }}
                    ></div>
                    <Flag
                      country={d.Driver.nationality}
                      className="w-5 h-auto rounded-sm"
                    />
                    <div>
                      <div className="font-medium text-white">
                        {d.Driver.givenName} {d.Driver.familyName}
                        <span className="text-neutral-500 font-mono text-xs ml-2">
                          #{d.Driver.permanentNumber}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-500 flex items-center gap-2">
                        {d.Constructors[0]?.name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                      <div className="text-xs text-neutral-500">Wins</div>
                      <div className="font-mono text-neutral-300">{d.wins}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-neutral-500">Points</div>
                      <div className="font-mono text-white text-lg">
                        {d.points}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {selectedDriver && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedDriver(null);
          }}
        >
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full pointer-events-none"></div>

            <button
              onClick={() => setSelectedDriver(null)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white z-10"
            >
              <i className="fas fa-times"></i>
            </button>

            <div className="flex items-center space-x-5 mb-8 relative z-10">
              <div className="w-20 h-20 rounded-full flex items-center justify-center bg-neutral-800 border border-neutral-600 text-3xl font-bold text-white shadow-lg">
                {selectedDriver.Driver.permanentNumber || "#"}
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white tracking-tight">
                  {selectedDriver.Driver.givenName}{" "}
                  {selectedDriver.Driver.familyName}
                </h2>
                <div className="flex items-center space-x-3 text-sm text-neutral-400 mt-2">
                  {selectedDriver.Constructors[0] && (
                    <div className="flex items-center space-x-2 bg-neutral-800/50 px-2 py-1 rounded">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: getTeamHex(
                            selectedDriver.Constructors[0].constructorId
                          ),
                        }}
                      ></span>
                      <span className="font-medium text-neutral-300">
                        {selectedDriver.Constructors[0].name}
                      </span>
                    </div>
                  )}
                  <span className="text-neutral-600">|</span>
                  <span className="flex items-center">
                    <Flag
                      country={selectedDriver.Driver.nationality}
                      className="mr-2 w-4 h-auto"
                    />
                    {selectedDriver.Driver.nationality}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-neutral-800/40 p-3 rounded-lg text-center border border-neutral-800">
                <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider mb-1">
                  Pts
                </div>
                <div className="text-lg font-mono text-white">
                  {selectedDriver.points}
                </div>
              </div>
              <div className="bg-neutral-800/40 p-3 rounded-lg text-center border border-neutral-800">
                <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider mb-1">
                  Wins
                </div>
                <div className="text-lg font-mono text-white">
                  {selectedDriver.wins}
                </div>
              </div>
              <div className="bg-neutral-800/40 p-3 rounded-lg text-center border border-neutral-800">
                <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider mb-1">
                  Rank
                </div>
                <div className="text-lg font-mono text-white">
                  P{selectedDriver.position}
                </div>
              </div>
              <div className="bg-neutral-800/40 p-3 rounded-lg text-center border border-neutral-800">
                <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider mb-1">
                  Podiums
                </div>
                <div className="text-lg font-mono text-white">
                  {driverResults.filter(
                    (r) => parseInt(r.Results[0].position) <= 3
                  ).length || "-"}
                </div>
              </div>
            </div>

            <div className="mb-2 bg-neutral-900/50 rounded-xl p-4 border border-neutral-800/50">
              <div className="flex justify-between items-end mb-4">
                <h3 className="text-xs font-mono uppercase text-neutral-500 font-bold">
                  Season Trend (Last 10)
                </h3>
                <div className="text-[10px] text-neutral-600">
                  Higher is Better
                </div>
              </div>
              {renderFormChart()}
            </div>
          </div>
        </div>
      )}

      {isCompareMode && selectedIds.length > 1 && (
        <div className="fixed bottom-20 md:bottom-8 left-1/2 transform -translate-x-1/2 z-50">
          <button
            onClick={handleCompare}
            className="px-6 py-3 bg-white text-black font-bold rounded-lg shadow-2xl hover:bg-neutral-200 transition-colors"
          >
            Compare {selectedIds.length} Drivers
          </button>
        </div>
      )}

      {showCompareModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCompareModal(false);
          }}
        >
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
                Driver Comparison
              </h2>
              <button
                onClick={() => setShowCompareModal(false)}
                className="text-neutral-500 hover:text-white"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="h-80 mb-8">{renderComparisonChart()}</div>
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-4">
              Season Stats
            </h3>
            {renderStatsComparison()}
          </div>
        </div>
      )}
    </div>
  );
};
