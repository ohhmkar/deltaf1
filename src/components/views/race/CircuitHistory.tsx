import React, { useEffect, useState } from "react";
import { fetchData } from "../../../services/api";
import { getTeamHex } from "../../../utils/helpers";
import type { Race } from "../../../types";

const lapMs = (t: string) => {
  const [m, s] = t.includes(":") ? t.split(":") : ["0", t];
  return parseInt(m) * 60_000 + parseFloat(s) * 1000;
};

// Winners and the fastest race lap at this circuit, counting only races
// *before* `before` (a race date): accurate "going into this race" and never a
// spoiler for the race on the page.
export const CircuitHistory: React.FC<{ circuitId: string; before: string }> = ({
  circuitId,
  before,
}) => {
  const [winners, setWinners] = useState<Race[] | null>(null);
  const [fastest, setFastest] = useState<Race[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let stale = false;
    setWinners(null);
    setFailed(false);
    // ponytail: limit=100 covers every circuit (Monza has hosted ~75 GPs)
    Promise.all([
      fetchData(`/circuits/${circuitId}/results/1.json?limit=100`),
      fetchData(`/circuits/${circuitId}/fastest/1/results.json?limit=100`),
    ])
      .then(([w, f]) => {
        if (stale) return;
        setWinners((w?.RaceTable?.Races ?? []).filter((r: Race) => r.date < before));
        setFastest((f?.RaceTable?.Races ?? []).filter((r: Race) => r.date < before));
      })
      .catch(() => !stale && setFailed(true));
    return () => {
      stale = true;
    };
  }, [circuitId, before]);

  if (failed)
    return <div className="bg-neutral-950 p-6 text-sm text-neutral-500">Couldn't load this circuit's history.</div>;
  if (!winners) return <div className="bg-neutral-950 p-6 animate-pulse min-h-[260px]" />;
  if (!winners.length)
    return (
      <div className="bg-neutral-950 p-6 text-sm text-neutral-500">
        First Grand Prix at this circuit.
      </div>
    );

  const counts = new Map<string, { name: string; team: string; n: number }>();
  for (const r of winners) {
    const w = r.Results![0];
    const c = counts.get(w.Driver.driverId) ?? {
      name: `${w.Driver.givenName} ${w.Driver.familyName}`,
      team: w.Constructor.constructorId,
      n: 0,
    };
    c.n++;
    c.team = w.Constructor.constructorId; // winners are chronological: colour by latest win
    counts.set(w.Driver.driverId, c);
  }
  const top = [...counts.values()].sort((a, b) => b.n - a.n).slice(0, 3);
  const recent = winners.slice(-5).reverse();
  const best = fastest
    .map((r) => ({ r, res: r.Results![0] }))
    .filter((x) => x.res.FastestLap?.Time?.time)
    .sort((a, b) => lapMs(a.res.FastestLap!.Time.time) - lapMs(b.res.FastestLap!.Time.time))[0];

  return (
    <div className="bg-neutral-950 p-6 space-y-5 text-sm">
      <p className="text-neutral-400">
        {winners.length} Grand{winners.length > 1 ? "s" : ""} Prix held here before this one.
      </p>

      <div>
        <h3 className="font-display font-semibold text-base text-white mb-1.5">Most wins</h3>
        {top.map((t) => (
          <div key={t.name} className="flex items-center justify-between py-0.5">
            <span className="flex items-center gap-2 text-neutral-200">
              <span className="w-1 h-4 rounded-full" style={{ backgroundColor: getTeamHex(t.team) }} />
              {t.name}
            </span>
            <span className="font-display font-bold text-white">{t.n}</span>
          </div>
        ))}
      </div>

      <div>
        <h3 className="font-display font-semibold text-base text-white mb-1.5">Recent winners</h3>
        {recent.map((r) => (
          <div key={r.season + r.round} className="flex justify-between py-0.5 text-neutral-300">
            <span className="font-display text-neutral-500 w-12">{r.season}</span>
            <span className="flex-1 truncate">
              {r.Results![0].Driver.givenName} {r.Results![0].Driver.familyName}
            </span>
          </div>
        ))}
      </div>

      {best && (
        <div>
          <h3 className="font-display font-semibold text-base text-white mb-1">
            Fastest race lap <span className="font-sans font-normal text-xs text-neutral-500">since 2004, any layout</span>
          </h3>
          <div className="text-white">
            <span className="font-display font-bold text-lg text-purple-400">{best.res.FastestLap!.Time.time}</span>
            <span className="text-neutral-400">
              {" "}
              {best.res.Driver.givenName} {best.res.Driver.familyName}, {best.r.season}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
