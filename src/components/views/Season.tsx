import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { fetchData } from "../../services/api";
import { formatDateLocal, raceStart, localTzLabel } from "../../utils/helpers";
import { Flag, SkeletonCard } from "../shared";
import { RacePage } from "./race/RacePage";
import type { Race } from "../../types";

export const Season: React.FC = () => {
  const currentYear = new Date().getFullYear();
  // ?year= and ?round= live in the URL so refresh/back/share keep them
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const yearParam = Number(params.get("year"));
  const year =
    yearParam >= 1950 && yearParam <= currentYear ? yearParam : currentYear;
  const setYear = (y: number) =>
    setParams(y === currentYear ? {} : { year: String(y) }, { replace: true });
  const selectedRound = params.get("round");
  const openedHere = useRef(false); // opened by a click (pushed) vs deep link
  const openRace = (round: string) => {
    openedHere.current = true;
    setParams((p) => {
      p.set("round", round);
      return p;
    });
  };
  const backToCalendar = () => {
    if (openedHere.current) navigate(-1);
    else
      setParams(
        (p) => {
          p.delete("round");
          return p;
        },
        { replace: true }
      );
    openedHere.current = false;
  };
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);

  const years = Array.from(
    { length: currentYear - 1950 + 1 },
    (_, i) => currentYear - i
  );

  useEffect(() => {
    let stale = false; // a slower response for a previous year must not win
    const load = async () => {
      setLoading(true);
      setRaces([]);
      try {
        const endpoint =
          year === currentYear ? "/current.json" : `/${year}.json`;
        const data = await fetchData(endpoint);
        if (stale) return;
        if (data && data.RaceTable) {
          setRaces(data.RaceTable.Races);
        }
      } catch (e) {
        console.error(e);
      }
      if (!stale) setLoading(false);
    };
    load();
    return () => {
      stale = true;
    };
  }, [year]);

  const nextRound = races.find((r) => raceStart(r) > new Date())?.round;

  if (loading && !selectedRound)
    return (
      <div className="p-6 md:p-16 max-w-5xl mx-auto h-screen overflow-y-auto pb-24 space-y-4">
        {Array.from({ length: 8 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );

  if (selectedRound)
    return (
      <RacePage
        year={year}
        round={selectedRound}
        races={races}
        onBack={backToCalendar}
        // replace, not push: Back should still lead to the calendar
        onGo={(r) =>
          setParams(
            (p) => {
              p.set("round", r);
              return p;
            },
            { replace: true }
          )
        }
      />
    );

  return (
    <div className="p-6 md:p-16 max-w-5xl mx-auto h-screen overflow-y-auto fade-in pb-24">
      <header className="mb-8 border-b border-neutral-800 pb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-white mb-1">
            Calendar
          </h1>
          <p className="text-neutral-500 text-sm">
            {year} Season Schedule · times in {localTzLabel()}
          </p>
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
          const raceDate = raceStart(r);
          const isPast = year < currentYear || raceDate < new Date();
          const month = raceDate.toLocaleString("default", { month: "short" });
          const day = raceDate.getDate();

          const raceTime = formatDateLocal(r.date, r.time);
          const raceDisplay =
            raceTime === "TBA" ? "TBA" : raceTime.split(" ")[1];

          return (
            <button
              key={r.round}
              onClick={() => openRace(r.round)}
              className={`minimal-card w-full text-left p-6 flex flex-col md:flex-row items-start md:items-center justify-between hover:bg-neutral-900/50 cursor-pointer transition-colors group ${
                isPast ? "" : "opacity-80 hover:opacity-100"
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
                  ) : r.round === nextRound ? (
                    <span className="text-[10px] bg-white text-black px-2 py-1 rounded font-bold">
                      NEXT
                    </span>
                  ) : (
                    <span className="text-[10px] border border-neutral-700 text-neutral-500 px-2 py-1 rounded font-bold">
                      PREVIEW
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
