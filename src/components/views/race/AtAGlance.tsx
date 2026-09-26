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
      sub: `${name(fl)} · lap ${fl.FastestLap.lap}`,
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
        sub: `${name(r)} · lap ${q.lap} · pit lane`,
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
      sub: `${name(movers[0].r)} · P${movers[0].r.grid} → P${movers[0].r.position}`,
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {tiles.map((t) => (
        <div key={t.label} className="minimal-card p-4 relative overflow-hidden">
          {t.color && <div className="absolute left-0 inset-y-0 w-1" style={{ backgroundColor: t.color }} />}
          <div className="text-[10px] uppercase tracking-wider text-neutral-500">{t.label}</div>
          <div className={`text-xl md:text-2xl font-mono font-semibold mt-1 ${t.accent ?? "text-white"}`}>
            {t.value}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1 truncate">{t.sub}</div>
        </div>
      ))}
    </div>
  );
};
