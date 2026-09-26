import React from "react";
import { getTeamHex } from "../../../utils/helpers";
import { Flag } from "../../shared";
import type { RaceResult } from "../../../types";

// The winner gets the stage; P2 and P3 stack beside it. Hairline gaps (not
// separate cards) keep the three reading as one result.
export const Podium: React.FC<{ results: RaceResult[] }> = ({ results }) => {
  const [win, second, third] = results;
  if (!third) return null;
  const color = getTeamHex(win.Constructor.constructorId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-px rounded-2xl overflow-hidden bg-neutral-800 border border-neutral-800">
      <div className="relative bg-neutral-950 p-6 md:p-8 flex items-end gap-5 md:gap-7 min-h-[220px] overflow-hidden">
        <span className="absolute left-0 inset-y-0 w-1.5" style={{ backgroundColor: color }} />
        <span
          className="font-display font-black leading-[0.75] text-[7rem] md:text-[10rem] select-none"
          style={{ color, filter: "brightness(1.35) saturate(1.1)" }}
          aria-hidden
        >
          1
        </span>
        <div className="pb-1 min-w-0">
          <div className="flex items-center gap-2 text-neutral-400 text-sm">
            <Flag country={win.Driver.nationality} className="w-5 h-auto rounded-[2px]" />
            {win.Driver.givenName}
          </div>
          <div className="font-display font-bold uppercase text-4xl md:text-6xl leading-none text-white tracking-tight truncate">
            <span className="sr-only">Winner: {win.Driver.givenName} </span>
            {win.Driver.familyName}
          </div>
          <div className="mt-3 text-sm text-neutral-400">
            {win.Constructor.name}
            <span className="text-neutral-600 mx-2">/</span>
            <span className="font-display text-neutral-200 text-base">{win.Time?.time ?? win.status}</span>
            <span className="text-neutral-600 mx-2">/</span>
            {win.points} points
          </div>
        </div>
      </div>

      <div className="grid grid-rows-2 gap-px">
        {[second, third].map((r) => {
          const c = getTeamHex(r.Constructor.constructorId);
          return (
            <div key={r.position} className="relative bg-neutral-950 px-6 py-4 flex items-center gap-4">
              <span className="absolute left-0 inset-y-0 w-1" style={{ backgroundColor: c }} />
              <span className="font-display font-black text-5xl leading-none w-8" style={{ color: c }} aria-hidden>
                {r.position}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-neutral-500">
                  <span className="sr-only">P{r.position}: </span>
                  {r.Driver.givenName}
                  <span className="text-neutral-700 mx-1.5">/</span>
                  {r.Constructor.name}
                </div>
                <div className="font-display font-bold uppercase text-2xl leading-tight text-white truncate">
                  {r.Driver.familyName}
                </div>
              </div>
              <span className="font-display text-neutral-300 text-lg">{r.Time?.time ?? r.status}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
