import React from "react";
import { getTeamHex } from "../../../utils/helpers";
import type { RaceResult } from "../../../types";

// Race (or sprint) classification as one compact row per driver. Phones get
// the driver code and fewer columns; wider screens get full names.
export const ResultsTable: React.FC<{
  results: RaceResult[];
  stopsByDriver?: Record<string, number>;
}> = ({ results, stopsByDriver }) => (
  <div className="minimal-card p-0 overflow-hidden">
    <table className="w-full text-sm">
      <thead>
        <tr className="text-[10px] uppercase tracking-wider text-neutral-500 border-b border-neutral-800">
          <th className="py-2 pl-3 pr-1 text-left font-medium w-10">Pos</th>
          <th className="py-2 px-2 text-left font-medium">Driver</th>
          <th className="py-2 px-2 text-right font-medium">Time</th>
          <th className="py-2 px-2 text-right font-medium">Pts</th>
          <th className="py-2 px-2 text-right font-medium">Grid</th>
          {stopsByDriver && (
            <th className="py-2 px-2 text-right font-medium hidden sm:table-cell">Stops</th>
          )}
          <th className="py-2 pr-3 w-6"><span className="sr-only">Fastest lap</span></th>
        </tr>
      </thead>
      <tbody>
        {results.map((res) => {
          const grid = parseInt(res.grid);
          const pos = parseInt(res.position);
          const diff = grid === 0 ? 0 : grid - pos;
          const isDNF = res.positionText === "R" || res.positionText === "W" || isNaN(pos);
          const stops = stopsByDriver?.[res.Driver.driverId] ?? 0;
          const fastest = res.FastestLap?.rank === "1";
          return (
            <tr
              key={res.Driver.driverId}
              className="border-b border-neutral-800/50 last:border-0 hover:bg-neutral-900/50"
            >
              <td className="py-2 pl-3 pr-1 font-mono font-bold text-neutral-500">
                {res.positionText}
              </td>
              <td className="py-2 px-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-1 h-6 rounded-full shrink-0"
                    style={{ backgroundColor: getTeamHex(res.Constructor.constructorId) }}
                  />
                  <div className="min-w-0">
                    <div className="font-semibold text-white truncate">
                      <span className="sm:hidden">{res.Driver.code ?? res.Driver.familyName}</span>
                      <span className="hidden sm:inline">
                        {res.Driver.givenName} {res.Driver.familyName}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-500 truncate hidden sm:block">
                      {res.Constructor.name}
                    </div>
                  </div>
                </div>
              </td>
              <td className="py-2 px-2 text-right font-mono text-xs whitespace-nowrap">
                {isDNF ? (
                  <span className="text-red-500">{res.status}</span>
                ) : (
                  <span className="text-neutral-300">{res.Time?.time || res.status}</span>
                )}
              </td>
              <td
                className={`py-2 px-2 text-right font-mono text-xs font-bold ${
                  parseFloat(res.points) > 0 ? "text-white" : "text-neutral-600"
                }`}
              >
                {parseFloat(res.points) > 0 ? `+${res.points}` : "-"}
              </td>
              <td className="py-2 px-2 text-right font-mono text-xs whitespace-nowrap">
                <span className="text-neutral-500">{grid === 0 ? "PL" : grid}</span>
                {!isDNF && grid !== 0 && diff !== 0 && (
                  <span
                    className={`ml-1 ${diff > 0 ? "text-green-500" : "text-red-500"}`}
                    title={diff > 0 ? `Gained ${diff} places` : `Lost ${-diff} places`}
                  >
                    {diff > 0 ? `▲${diff}` : `▼${-diff}`}
                  </span>
                )}
              </td>
              {stopsByDriver && (
                <td className="py-2 px-2 text-right font-mono text-xs text-neutral-400 hidden sm:table-cell">
                  {stops || "-"}
                </td>
              )}
              <td className="py-2 pr-3 text-right">
                {fastest && (
                  <i className="fas fa-stopwatch text-purple-500" title="Fastest lap"></i>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);
