import React, { useEffect, useState } from "react";
import { fetchData } from "../../../services/api";
import { getTeamHex } from "../../../utils/helpers";

type Kind = "driver" | "constructor";
type Row = { id: string; name: string; team: string; pos: number; pts: number };

const rows = (data: any, kind: Kind): Row[] => {
  const list = data?.StandingsTable?.StandingsLists?.[0];
  const items = list?.[kind === "driver" ? "DriverStandings" : "ConstructorStandings"] ?? [];
  return items.map((s: any) => ({
    id: kind === "driver" ? s.Driver.driverId : s.Constructor.constructorId,
    name: kind === "driver" ? s.Driver.familyName : s.Constructor.name,
    team: kind === "driver" ? s.Constructors?.[0]?.constructorId ?? "" : s.Constructor.constructorId,
    pos: parseInt(s.position),
    pts: parseFloat(s.points),
  }));
};

// Standings after this round vs the round before: points gained and places moved.
export const Championship: React.FC<{ year: number; round: string }> = ({ year, round }) => {
  const [kind, setKind] = useState<Kind>("driver");
  const [data, setData] = useState<{ now: Row[]; before: Row[] } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let stale = false;
    setData(null);
    setFailed(false);
    const path = kind === "driver" ? "driverStandings" : "constructorStandings";
    const r = parseInt(round);
    Promise.all([
      fetchData(`/${year}/${r}/${path}.json?limit=100`),
      r > 1 ? fetchData(`/${year}/${r - 1}/${path}.json?limit=100`) : Promise.resolve(null),
    ])
      .then(([now, before]) => !stale && setData({ now: rows(now, kind), before: rows(before, kind) }))
      .catch(() => !stale && setFailed(true));
    return () => {
      stale = true;
    };
  }, [year, round, kind]);

  const tab = (k: Kind, label: string) => (
    <button
      onClick={() => setKind(k)}
      aria-pressed={kind === k}
      className={`px-2 py-1 rounded text-xs ${
        kind === k ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-white"
      }`}
    >
      {label}
    </button>
  );

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wide">
          Championship after this round
        </h3>
        <div className="flex gap-1">
          {tab("driver", "Drivers")}
          {tab("constructor", "Teams")}
        </div>
      </div>
      <div className="minimal-card p-0 overflow-hidden">
        {failed ? (
          <p className="p-5 text-sm text-neutral-500">Standings unavailable.</p>
        ) : !data ? (
          <div className="p-5 min-h-[240px] animate-pulse" />
        ) : !data.now.length ? (
          <p className="p-5 text-sm text-neutral-500">No standings for this round.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {data.now.slice(0, 10).map((row) => {
                const b = data.before.find((x) => x.id === row.id);
                const moved = b ? b.pos - row.pos : 0;
                const gained = row.pts - (b?.pts ?? 0);
                return (
                  <tr key={row.id} className="border-b border-neutral-800/50 last:border-0">
                    <td className="py-2 pl-4 w-10 font-mono text-neutral-500">{row.pos}</td>
                    <td className="py-2 w-10 font-mono text-xs">
                      {moved > 0 && <span className="text-green-500">▲{moved}</span>}
                      {moved < 0 && <span className="text-red-500">▼{-moved}</span>}
                    </td>
                    <td className="py-2">
                      <span className="flex items-center gap-2 text-neutral-200">
                        <span
                          className="w-1 h-4 rounded-full"
                          style={{ backgroundColor: getTeamHex(row.team) }}
                        />
                        {row.name}
                      </span>
                    </td>
                    <td className="py-2 text-right font-mono text-xs text-neutral-500">
                      {gained > 0 ? `+${gained}` : ""}
                    </td>
                    <td className="py-2 pr-4 pl-4 text-right font-mono text-white w-16">{row.pts}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};
