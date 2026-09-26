import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import { fetchData } from "../../../services/api";
import { getCircuitImg, raceStart } from "../../../utils/helpers";
import { Flag, Spoiler, SkeletonCard } from "../../shared";
import type { Race, PitStop } from "../../../types";
import { Podium } from "./Podium";
import { Sessions } from "./Sessions";
import { CircuitHistory } from "./CircuitHistory";
import { Championship } from "./Championship";
import { Preview } from "./Preview";
import { Analysis } from "./Analysis";
import { AtAGlance } from "./AtAGlance";

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

  const idx = races.findIndex((r) => r.round === round);
  // results when the race has run; the calendar entry (schedule) otherwise
  const info = raceDetails ?? races[idx] ?? null;
  const prev = idx > 0 ? races[idx - 1] : null;
  const next = idx >= 0 && idx < races.length - 1 ? races[idx + 1] : null;
  const navBtn =
    "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors min-w-0";
  const short = (name: string) => name.replace(" Grand Prix", " GP");
  const img = info ? getCircuitImg(info.Circuit.circuitId) : null;

  return (
    <div className="h-screen overflow-y-auto fade-in pb-24">
      {/* sticky bar: back + previous/next stay reachable while scrolling */}
      <div className="sticky top-0 z-20 bg-[#0a0a0a]/85 light:bg-white/85 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-5xl mx-auto px-4 md:px-8 h-12 flex items-center justify-between gap-2">
          <button
            onClick={onBack}
            className="text-neutral-400 hover:text-white flex items-center gap-2 text-sm group shrink-0"
          >
            <i className="fas fa-arrow-left group-hover:-translate-x-0.5 transition-transform"></i>
            Calendar
          </button>
          {info && (
            <span className="hidden md:block text-sm font-display font-semibold text-neutral-300 truncate">
              {short(info.raceName)} {info.season}
            </span>
          )}
          <nav aria-label="Other races" className="flex items-center gap-1 min-w-0">
            {prev && (
              <button onClick={() => onGo(prev.round)} className={navBtn} title={prev.raceName}>
                <i className="fas fa-chevron-left"></i>
                <span className="truncate hidden sm:inline">{short(prev.raceName)}</span>
                <span className="sm:hidden">R{prev.round}</span>
              </button>
            )}
            {next && (
              <button onClick={() => onGo(next.round)} className={navBtn} title={next.raceName}>
                <span className="truncate hidden sm:inline">{short(next.raceName)}</span>
                <span className="sm:hidden">R{next.round}</span>
                <i className="fas fa-chevron-right"></i>
              </button>
            )}
          </nav>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 pt-8">
        {loadingDetails ? (
          <div className="space-y-6">
            <SkeletonCard className="min-h-[120px]" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <SkeletonCard className="min-h-[160px]" />
              <SkeletonCard className="min-h-[160px]" />
              <SkeletonCard className="min-h-[160px]" />
            </div>
            <SkeletonCard className="min-h-[320px]" />
          </div>
        ) : info ? (
          <>
            <header className="mb-8">
              <p className="text-sm text-neutral-400 mb-2">
                Round {info.round}
                {races.length ? ` of ${races.length}` : ""}, {info.season} season.{" "}
                {raceStart(info).toLocaleDateString(undefined, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
              <h1 className="font-display font-bold text-4xl md:text-6xl leading-[0.95] tracking-tight text-white mb-4">
                {info.raceName}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3 text-neutral-400 text-sm">
                <span className="flex items-center">
                  <Flag country={info.Circuit.Location.country} className="w-4 h-auto mr-2 rounded shadow-sm" />
                  {info.Circuit.circuitName}, {info.Circuit.Location.locality}
                </span>
                {/* OpenF1 (Replay's source) covers 2023 on; matched by race date */}
                {raceDetails && parseInt(info.season) >= 2023 && (
                  <Link
                    to={`/replay?year=${info.season}&date=${info.date}`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-500 text-xs font-medium"
                  >
                    <i className="fas fa-circle-play"></i> Watch replay
                  </Link>
                )}
              </div>
            </header>

            {!raceDetails ? (
              <Preview race={info} />
            ) : (
              /* everything that gives the result away sits under one cover */
              <Spoiler tall>
                <div className="space-y-10 mb-12">
                  <div className="space-y-3">
                    <Podium results={raceDetails.Results ?? []} />
                    <AtAGlance results={raceDetails.Results ?? []} stops={pitStops} />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    <div className="lg:col-span-2">
                      <Sessions
                        year={year}
                        round={round}
                        race={raceDetails.Results ?? []}
                        stopsByDriver={stopsByDriver}
                        hasSprint={!!races[idx]?.Sprint}
                      />
                    </div>
                    <Championship year={year} round={round} />
                  </div>
                  <Analysis
                    season={raceDetails.season}
                    date={raceDetails.date}
                    results={raceDetails.Results ?? []}
                    stops={pitStops}
                  />
                </div>
              </Spoiler>
            )}

            <section className="mb-12">
              <h2 className="font-display font-bold text-2xl text-white leading-none mb-5">Circuit</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-px rounded-2xl overflow-hidden bg-neutral-800 border border-neutral-800">
                <div className="overflow-hidden relative min-h-[260px] bg-neutral-950">
                  {img ? (
                    <div className="absolute inset-0 p-6 flex items-center justify-center">
                      <img
                        src={img}
                        className="circuit-map max-w-full max-h-full object-contain"
                        alt={`${info.Circuit.circuitName} layout`}
                      />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 text-neutral-700">
                      <i className="fas fa-road text-4xl"></i>
                    </div>
                  )}
                </div>
                <CircuitHistory circuitId={info.Circuit.circuitId} before={info.date} />
              </div>
            </section>
          </>
        ) : (
          <div className="text-center py-12 text-neutral-500 flex flex-col items-center">
            <i className="fas fa-flag text-2xl mb-2 opacity-50"></i>
            <p>Race not found.</p>
          </div>
        )}
      </div>
    </div>
  );
};
