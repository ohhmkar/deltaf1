import React from "react";
import { getTeamHex } from "../../../utils/helpers";
import type { PitStop, RaceResult } from "../../../types";
import { pitSecs } from "./PitStops";

// Four headline facts under the podium. Tiles without data are left out.
export const AtAGlance: React.FC<{ results: RaceResult[]; stops: PitStop[] }> = ({ results, stops }) => {
  const name = (r: RaceResult) => `${r.Driver.givenName.charAt(0)}. ${r.Driver.familyName}`;
  const tiles: { label: string; value: string; sub: string; color?: string; accent?: string }[] = [];

  const fl = results.find((r) => r.FastestLap?.rank === "1");
  if (fl?.FastestLap)
    tiles.push({
      label: "Fastest lap",
      value: fl.FastestLap.Time.time,
      sub: `${name(fl)}, lap ${fl.FastestLap.lap}`,
      color: getTeamHex(fl.Constructor.constructorId),
      accent: "text-purple-400",
    });

  if (stops.length) {
    const q = stops.reduce((a, b) => (pitSecs(b.duration) < pitSecs(a.duration) ? b : a));
    const r = results.find((x) => x.Driver.driverId === q.driverId);
    if (r)
      tiles.push({
        label: "Quickest stop",
        value: `${pitSecs(q.duration).toFixed(1)}s`,
        sub: `${name(r)}, lap ${q.lap} (pit lane time)`,
        color: getTeamHex(r.Constructor.constructorId),
      });
  }

  const movers = results
    .filter((r) => parseInt(r.grid) > 0 && !isNaN(parseInt(r.position)) && /^\d+$/.test(r.positionText))
    .map((r) => ({ r, gain: parseInt(r.grid) - parseInt(r.position) }))
    .sort((a, b) => b.gain - a.gain);
  if (movers[0]?.gain > 0)
    tiles.push({
      label: "Biggest mover",
      value: `▲${movers[0].gain}`,
      sub: `${name(movers[0].r)}, P${movers[0].r.grid} to P${movers[0].r.position}`,
      color: getTeamHex(movers[0].r.Constructor.constructorId),
      accent: "text-green-500",
    });

  const out = results.filter((r) => !/^\d+$/.test(r.positionText));
  tiles.push({
    label: "Retirements",
    value: String(out.length),
    sub: out.length ? out.slice(0, 3).map((r) => r.Driver.code ?? r.Driver.familyName).join(", ") + (out.length > 3 ? "…" : "") : "Everyone classified",
  });

  return (
    // gap-px over a border-coloured backdrop draws the dividing hairlines
    <dl className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-800 border-y border-neutral-800">
      {tiles.map((t) => (
        <div key={t.label} className="bg-[#0a0a0a] light:bg-neutral-50 px-4 md:px-5 py-4 min-w-0">
          <dt className="text-xs text-neutral-500">{t.label}</dt>
          <dd className={`font-display font-bold text-2xl md:text-3xl leading-tight mt-0.5 ${t.accent ?? "text-white"}`}>
            {t.value}
          </dd>
          <dd className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1.5 min-w-0">
            {t.color && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />}
            <span className="truncate">{t.sub}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
};
