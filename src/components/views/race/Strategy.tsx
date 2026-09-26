import React, { useEffect, useState } from "react";
import { fetchStints, type OF1Stint } from "../../../services/openf1";
import { compound, getTeamHex } from "../../../utils/helpers";
import type { RaceResult } from "../../../types";
import { useOpenF1Session } from "./useOpenF1Session";

// One bar per driver (finishing order), split into stints coloured by
// compound. OpenF1 data, 2023 on.
export const Strategy: React.FC<{ season: string; date: string; results: RaceResult[] }> = ({
  season,
  date,
  results,
}) => {
  const session = useOpenF1Session(season, date);
  const [stints, setStints] = useState<Map<number, OF1Stint[]> | null>(null);

  useEffect(() => {
    if (!session) return;
    let stale = false;
    setStints(null);
    fetchStints(session.session_key)
      .then((all) => {
        if (stale) return;
        const m = new Map<number, OF1Stint[]>();
        for (const s of all) m.set(s.driver_number, [...(m.get(s.driver_number) ?? []), s]);
        for (const arr of m.values()) arr.sort((a, b) => a.lap_start - b.lap_start);
        setStints(m);
      })
      .catch(() => !stale && setStints(new Map()));
    return () => {
      stale = true;
    };
  }, [session]);

  if (session === null) return null; // pre-2023 or not in OpenF1
  const totalLaps = parseInt(results[0]?.laps ?? "0");
  const used = new Set<string>();

  return (
    <section>
      <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4">Tyre Strategy</h3>
      <div className="minimal-card p-5">
        {!stints ? (
          <div className="min-h-[300px] animate-pulse" />
        ) : !stints.size || !totalLaps ? (
          <p className="text-sm text-neutral-500">No tyre data for this race.</p>
        ) : (
          <>
            <div className="space-y-1">
              {results.map((r) => {
                const arr = stints.get(parseInt(r.number)) ?? [];
                return (
                  <div key={r.Driver.driverId} className="flex items-center gap-2 text-xs">
                    <span className="w-10 shrink-0 font-semibold text-neutral-300 flex items-center gap-1.5">
                      <span
                        className="w-1 h-3 rounded-full"
                        style={{ backgroundColor: getTeamHex(r.Constructor.constructorId) }}
                      />
                      {r.Driver.code ?? r.Driver.familyName.slice(0, 3).toUpperCase()}
                    </span>
                    <div className="flex-1 relative h-4 rounded-sm bg-neutral-900">
                      {arr.map((s) => {
                        const t = compound(s.compound);
                        used.add(s.compound?.toUpperCase());
                        const end = Math.min(s.lap_end ?? totalLaps, totalLaps);
                        return (
                          <span
                            key={s.lap_start}
                            title={`${s.compound} · laps ${s.lap_start}-${end}${
                              s.tyre_age_at_start ? ` · ${s.tyre_age_at_start} laps old` : ""
                            }`}
                            className="absolute top-0 h-full border-r-2 border-neutral-950 flex items-center justify-center text-[9px] font-bold text-black"
                            style={{
                              left: `${((s.lap_start - 1) / totalLaps) * 100}%`,
                              width: `${((end - s.lap_start + 1) / totalLaps) * 100}%`,
                              backgroundColor: t.c,
                            }}
                          >
                            {end - s.lap_start >= 4 ? t.l : ""}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3 mt-4 pl-12 text-[10px] text-neutral-500">
              {[...used].filter(Boolean).map((c) => (
                <span key={c} className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: compound(c).c }} />
                  {c.charAt(0) + c.slice(1).toLowerCase()}
                </span>
              ))}
              <span className="ml-auto">{totalLaps} laps</span>
            </div>
          </>
        )}
      </div>
    </section>
  );
};
