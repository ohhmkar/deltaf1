import React, { useEffect, useState } from "react";
import { fetchData } from "../../../services/api";
import { getTeamHex } from "../../../utils/helpers";
import { Tabs } from "../../shared";

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

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-white leading-none">Standings</h2>
          <p className="text-xs text-neutral-500 mt-1">After round {round}</p>
        </div>
        <Tabs
          label="Standings"
          size="sm"
          value={kind}
          onChange={setKind}
          options={[
            ["driver", "Drivers"],
            ["constructor", "Teams"],
          ]}
        />
      </div>
      <div>
        {failed ? (
          <p className="py-6 text-sm text-neutral-500">Couldn't load the standings. Switch tabs to retry.</p>
        ) : !data ? (
          <div className="min-h-[240px] rounded-xl bg-neutral-900/50 animate-pulse" />
        ) : !data.now.length ? (
          <p className="py-6 text-sm text-neutral-500">No standings recorded for this round.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {data.now.slice(0, 10).map((row) => {
                const b = data.before.find((x) => x.id === row.id);
                const moved = b ? b.pos - row.pos : 0;
                const gained = row.pts - (b?.pts ?? 0);
                return (
                  <tr key={row.id} className="border-b border-neutral-800/60 last:border-0">
                    <td className="py-2.5 pr-2 w-8 font-display font-bold text-lg leading-none text-neutral-400">{row.pos}</td>
                    <td className="py-2.5 w-9 font-display text-xs">
                      {moved > 0 && <span className="text-green-500">▲{moved}</span>}
                      {moved < 0 && <span className="text-red-500">▼{-moved}</span>}
                    </td>
                    <td className="py-2.5">
                      <span className="flex items-center gap-2.5 font-display font-semibold text-base text-white">
                        <span
                          className="w-1 h-4 rounded-full"
                          style={{ backgroundColor: getTeamHex(row.team) }}
                        />
                        {row.name}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-display text-sm text-green-500/80">
                      {gained > 0 ? `+${gained}` : ""}
                    </td>
                    <td className="py-2.5 pl-3 text-right font-display font-bold text-base text-white w-14">{row.pts}</td>
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
