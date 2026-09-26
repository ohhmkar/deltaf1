import React from "react";
import { getTeamHex } from "../../../utils/helpers";
import { Flag } from "../../shared";
import type { RaceResult } from "../../../types";

// Top three as cards: P2 | P1 | P3 on wide screens, P1-P2-P3 stacked on phones.
export const Podium: React.FC<{ results: RaceResult[] }> = ({ results }) => {
  const top = results.slice(0, 3);
  if (top.length < 3) return null;
  const order = [top[1], top[0], top[2]];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:items-end mb-8">
      {order.map((r) => {
        const p = parseInt(r.position);
        const color = getTeamHex(r.Constructor.constructorId);
        return (
          <div
            key={r.position}
            className={`minimal-card relative overflow-hidden p-5 ${
              p === 1 ? "order-first sm:order-none sm:pb-10" : ""
            }`}
          >
            <div className="absolute top-0 inset-x-0 h-1" style={{ backgroundColor: color }} />
            <div className="flex items-start justify-between">
              <span
                className={`font-mono font-bold ${
                  p === 1 ? "text-4xl text-yellow-500" : "text-3xl text-neutral-500"
                }`}
              >
                P{p}
              </span>
              <Flag country={r.Driver.nationality} className="w-5 h-auto opacity-70 mt-2" />
            </div>
            <div className="mt-3 text-lg font-bold text-white leading-tight">
              {r.Driver.givenName} <span className="uppercase">{r.Driver.familyName}</span>
            </div>
            <div className="text-xs text-neutral-500 mt-0.5">{r.Constructor.name}</div>
            <div className="mt-3 flex justify-between text-xs font-mono">
              <span className="text-neutral-300">{r.Time?.time ?? r.status}</span>
              <span className="text-neutral-500">+{r.points} pts</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
