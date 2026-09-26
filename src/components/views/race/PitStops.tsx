import React from "react";
import { getTeamHex } from "../../../utils/helpers";
import type { PitStop, RaceResult } from "../../../types";

// "21.619" or "1:02.345" (red-flag stops) -> seconds
export const pitSecs = (d: string) => {
  const [m, s] = d.includes(":") ? d.split(":") : ["0", d];
  return parseInt(m) * 60 + parseFloat(s);
};

// Every driver's stops in finishing order; the quickest is highlighted.
// jolpi durations are pit-lane time (entry to exit), not the ~2s stationary
// time. Data exists from 2011.
export const PitStops: React.FC<{ stops: PitStop[]; results: RaceResult[] }> = ({
  stops,
  results,
}) => {
  if (!stops.length) return null;
  const byDriver = new Map<string, PitStop[]>();
  for (const s of stops) byDriver.set(s.driverId, [...(byDriver.get(s.driverId) ?? []), s]);
  const fastest = stops.reduce((a, b) => (pitSecs(b.duration) < pitSecs(a.duration) ? b : a));

  return (
    <section>
      <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4">Pit Stops</h3>
      <div className="minimal-card p-5">
        <div className="space-y-1.5">
          {results
            .filter((r) => byDriver.has(r.Driver.driverId))
            .map((r) => (
              <div key={r.Driver.driverId} className="flex items-center gap-3 text-xs">
                <span className="w-10 font-semibold text-neutral-200 flex items-center gap-1.5">
                  <span
                    className="w-1 h-4 rounded-full"
                    style={{ backgroundColor: getTeamHex(r.Constructor.constructorId) }}
                  />
                  {r.Driver.code ?? r.Driver.familyName.slice(0, 3).toUpperCase()}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {byDriver.get(r.Driver.driverId)!.map((s) => (
                    <span
                      key={s.stop}
                      title={`Stop ${s.stop}, lap ${s.lap}`}
                      className={`px-2 py-0.5 rounded font-mono ${
                        s === fastest
                          ? "bg-purple-500/20 text-purple-300"
                          : "bg-neutral-800 text-neutral-300"
                      }`}
                    >
                      L{s.lap} · {pitSecs(s.duration).toFixed(1)}s
                    </span>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
};
