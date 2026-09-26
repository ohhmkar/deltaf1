import React from "react";
import { getTeamHex } from "../../../utils/helpers";
import type { RaceResult } from "../../../types";

// Race (or sprint) classification, one line per driver like a timing tower:
// position, team colour, SURNAME, gap. Phones get the three-letter code.
export const ResultsTable: React.FC<{
  results: RaceResult[];
  stopsByDriver?: Record<string, number>;
}> = ({ results, stopsByDriver }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="text-xs text-neutral-500 border-b border-neutral-800">
          <th className="py-2 pr-2 text-left font-normal w-10">
            <span className="sr-only">Position</span>
          </th>
          <th className="py-2 px-2 text-left font-normal">Driver</th>
          <th className="py-2 px-2 text-left font-normal hidden lg:table-cell">Team</th>
          <th className="py-2 px-2 text-right font-normal">Time</th>
          <th className="py-2 px-2 text-right font-normal">Pts</th>
          <th className="py-2 px-2 text-right font-normal">Grid</th>
          {stopsByDriver && (
            <th className="py-2 px-2 text-right font-normal hidden sm:table-cell">Stops</th>
          )}
          <th className="py-2 pl-2 w-6">
            <span className="sr-only">Fastest lap</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {results.map((res) => {
          const grid = parseInt(res.grid);
          const pos = parseInt(res.position);
          const diff = grid === 0 ? 0 : grid - pos;
          const out = !/^\d+$/.test(res.positionText);
          const stops = stopsByDriver?.[res.Driver.driverId] ?? 0;
          const fastest = res.FastestLap?.rank === "1";
          const pts = parseFloat(res.points);
          // lapped cars: jolpi's Time is the gap on their own last lap, which
          // reads like "1.3s behind"; show laps down instead, like a timing screen
          const down = parseInt(results[0]?.laps) - parseInt(res.laps);
          return (
            <tr
              key={res.Driver.driverId}
              className={`border-b border-neutral-800/60 last:border-0 hover:bg-neutral-900/60 ${
                out ? "text-neutral-500" : ""
              }`}
            >
              <td className="py-2.5 pr-2 font-display font-bold text-lg leading-none text-neutral-400">
                {res.positionText}
              </td>
              <td className="py-2.5 px-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-1 h-5 rounded-full shrink-0"
                    style={{ backgroundColor: getTeamHex(res.Constructor.constructorId) }}
                  />
                  <span className="truncate">
                    <span className="sm:hidden font-display font-bold uppercase text-base text-white">
                      {res.Driver.code ?? res.Driver.familyName}
                    </span>
                    <span className="hidden sm:inline">
                      <span className="text-neutral-400">{res.Driver.givenName} </span>
                      <span className={`font-display font-bold uppercase text-base ${out ? "text-neutral-400" : "text-white"}`}>
                        {res.Driver.familyName}
                      </span>
                    </span>
                  </span>
                </div>
              </td>
              <td className="py-2.5 px-2 text-neutral-500 hidden lg:table-cell truncate max-w-[160px]">
                {res.Constructor.name}
              </td>
              <td className="py-2.5 px-2 text-right whitespace-nowrap">
                {out ? (
                  <span className="text-red-400 text-xs">{res.status}</span>
                ) : down > 0 ? (
                  <span className="font-display text-base text-neutral-400">
                    +{down} lap{down > 1 ? "s" : ""}
                  </span>
                ) : (
                  <span className="font-display text-base text-neutral-200">{res.Time?.time || res.status}</span>
                )}
              </td>
              <td className={`py-2.5 px-2 text-right font-display text-base ${pts > 0 ? "text-white font-semibold" : "text-neutral-600"}`}>
                {pts > 0 ? res.points : "-"}
              </td>
              <td className="py-2.5 px-2 text-right whitespace-nowrap font-display">
                <span className="text-neutral-500">{grid === 0 ? "PL" : grid}</span>
                {!out && grid !== 0 && diff !== 0 && (
                  <span
                    className={`ml-1.5 text-xs ${diff > 0 ? "text-green-500" : "text-red-500"}`}
                    title={diff > 0 ? `Gained ${diff} places` : `Lost ${-diff} places`}
                  >
                    {diff > 0 ? `▲${diff}` : `▼${-diff}`}
                  </span>
                )}
              </td>
              {stopsByDriver && (
                <td className="py-2.5 px-2 text-right font-display text-neutral-400 hidden sm:table-cell">
                  {stops || "-"}
                </td>
              )}
              <td className="py-2.5 pl-2 text-right">
                {fastest && <i className="fas fa-stopwatch text-purple-400" title="Fastest lap"></i>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);
