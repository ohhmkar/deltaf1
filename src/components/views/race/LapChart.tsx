import React, { useEffect, useMemo, useState } from "react";
import {
  fetchLaps,
  fetchPositions,
  isLiveLocked,
  type OF1Lap,
  type OF1Position,
} from "../../../services/openf1";
import { getTeamHex } from "../../../utils/helpers";
import type { RaceResult } from "../../../types";
import { useOpenF1Session } from "./useOpenF1Session";
import { LiveLockNotice } from "../../shared";

const W = 800, ROW = 18, PAD_L = 8, PAD_R = 44, PAD_Y = 12;

// last position at or before t
const posAt = (arr: { t: number; p: number }[], t: number) => {
  let lo = 0, hi = arr.length - 1, res: number | null = null;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid].t <= t) {
      res = arr[mid].p;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return res;
};

// Position of every driver at the end of each lap (lap 0 = starting grid).
// A lap "ends" when the leader starts the next one; lines stop at the lap a
// driver retired. OpenF1 data, 2023 on.
export const LapChart: React.FC<{ season: string; date: string; results: RaceResult[] }> = ({
  season,
  date,
  results,
}) => {
  const session = useOpenF1Session(season, date);
  const [raw, setRaw] = useState<{ pos: OF1Position[]; laps: OF1Lap[] } | "locked" | "error" | null>(null);
  const [picked, setPicked] = useState<string[]>([]);

  useEffect(() => {
    if (!session || session === "locked") return;
    let stale = false;
    setRaw(null);
    Promise.all([fetchPositions(session.session_key), fetchLaps(session.session_key)])
      .then(([pos, laps]) => !stale && setRaw({ pos, laps }))
      .catch((e) => !stale && setRaw(isLiveLocked(e) ? "locked" : "error"));
    return () => {
      stale = true;
    };
  }, [session]);

  const series = useMemo(() => {
    if (!raw || typeof raw === "string") return null;
    const total = parseInt(results[0]?.laps ?? "0");
    const lapStart = new Map<number, number>();
    for (const l of raw.laps) {
      if (!l.date_start) continue;
      const t = Date.parse(l.date_start);
      if (!lapStart.has(l.lap_number) || t < lapStart.get(l.lap_number)!) lapStart.set(l.lap_number, t);
    }
    const byCar = new Map<number, { t: number; p: number }[]>();
    for (const p of raw.pos)
      byCar.set(p.driver_number, [...(byCar.get(p.driver_number) ?? []), { t: Date.parse(p.date), p: p.position }]);
    for (const arr of byCar.values()) arr.sort((a, b) => a.t - b.t);
    const seen = new Map<string, number>(); // team -> drivers so far (2nd gets dashed)
    return {
      total,
      lines: results.map((r) => {
        const team = r.Constructor.constructorId;
        const mate = seen.get(team) ?? 0;
        seen.set(team, mate + 1);
        const arr = byCar.get(parseInt(r.number)) ?? [];
        const grid = parseInt(r.grid);
        const pts: [number, number][] = grid > 0 ? [[0, grid]] : [];
        for (let lap = 1; lap <= Math.min(parseInt(r.laps), total); lap++) {
          const p = posAt(arr, lapStart.get(lap + 1) ?? Infinity);
          if (p) pts.push([lap, p]);
        }
        return { r, color: getTeamHex(team), dashed: mate > 0, pts };
      }),
    };
  }, [raw, results]);

  if (session === null)
    return <p className="minimal-card p-5 text-sm text-neutral-500">No OpenF1 data for this race.</p>;
  const n = results.length;
  const H = PAD_Y * 2 + (n - 1) * ROW;
  const x = (lap: number) => PAD_L + (lap / (series?.total || 1)) * (W - PAD_L - PAD_R);
  const y = (pos: number) => PAD_Y + (pos - 1) * ROW;
  const code = (r: RaceResult) => r.Driver.code ?? r.Driver.familyName.slice(0, 3).toUpperCase();
  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
      <div className="minimal-card p-4 relative">
        {picked.length > 0 && (
          <button
            onClick={() => setPicked([])}
            className="absolute top-3 right-4 z-10 text-xs text-neutral-500 hover:text-white"
          >
            clear
          </button>
        )}
        {session === "locked" || raw === "locked" ? (
          <LiveLockNotice />
        ) : raw === "error" ? (
          <p className="text-sm text-neutral-500">Couldn't load position data.</p>
        ) : !series ? (
          <div className="min-h-[360px] animate-pulse" />
        ) : !series.total ? (
          <p className="text-sm text-neutral-500">No lap data for this race.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[560px] h-auto" role="img"
                aria-label="Position of each driver at the end of every lap">
                {[0, 10, 20, 30, 40, 50, 60, 70].filter((l) => l <= series.total).map((l) => (
                  <line key={l} x1={x(l)} x2={x(l)} y1={PAD_Y - 6} y2={H - PAD_Y + 6}
                    style={{ stroke: "var(--chart-grid)" }} strokeWidth={1} />
                ))}
                {series.lines.map(({ r, color, dashed, pts }) => {
                  const on = !picked.length || picked.includes(r.Driver.driverId);
                  const last = pts[pts.length - 1];
                  return (
                    <g key={r.Driver.driverId} opacity={on ? 1 : 0.12}>
                      <polyline
                        points={pts.map(([l, p]) => `${x(l)},${y(p)}`).join(" ")}
                        fill="none" stroke={color} strokeWidth={on && picked.length ? 3 : 2}
                        strokeDasharray={dashed ? "5 3" : undefined} strokeLinejoin="round"
                      />
                      {last && (
                        <text x={x(last[0]) + 6} y={y(last[1]) + 4} fontSize={11} fontWeight={700} fill={color}>
                          {code(r)}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {series.lines.map(({ r, color, dashed }) => (
                <button
                  key={r.Driver.driverId}
                  onClick={() => toggle(r.Driver.driverId)}
                  aria-pressed={picked.includes(r.Driver.driverId)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                    picked.includes(r.Driver.driverId)
                      ? "border-neutral-400 text-white"
                      : "border-neutral-800 text-neutral-500 hover:text-white"
                  }`}
                  style={{ borderBottomColor: color, borderBottomStyle: dashed ? "dashed" : "solid", borderBottomWidth: 2 }}
                >
                  {code(r)}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-neutral-600 mt-2">
              Lap 0 is the starting grid. Pick drivers to highlight them.
            </p>
          </>
        )}
      </div>
  );
};
