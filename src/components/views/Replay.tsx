import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchRaceSessions,
  fetchDrivers,
  fetchLocations,
  fetchRaceControl,
  fetchPositions,
  fetchStints,
  OF1Session,
  OF1Driver,
  OF1Loc,
  OF1RaceControl,
  OF1Position,
  OF1Stint,
} from "../../services/openf1";

const WINDOW_MS = 60_000; // location fetched in 60s chunks (~0.5MB each, all cars)
const VIEW = 1000; // svg viewBox size
const PAD = 60;
const SPEEDS = [1, 2, 4, 8, 16];
const DNF_GAP_MS = 20_000; // no location for this long (in a loaded window) => car is out

type Pt = { t: number; x: number; y: number };
type Pos = { t: number; position: number };
type FeedItem = OF1RaceControl & { t: number };

// tyre compound colour + single-letter label
const COMPOUND: Record<string, { c: string; l: string }> = {
  SOFT: { c: "#ef4444", l: "S" },
  MEDIUM: { c: "#eab308", l: "M" },
  HARD: { c: "#e5e5e5", l: "H" },
  INTERMEDIATE: { c: "#22c55e", l: "I" },
  WET: { c: "#3b82f6", l: "W" },
};
const compound = (name: string) =>
  COMPOUND[name?.toUpperCase()] || { c: "#525252", l: "?" };

// border colour for a race-control event
const flagColor = (e: OF1RaceControl): string => {
  const f = (e.flag || "").toUpperCase();
  if (f.includes("RED")) return "#ef4444";
  if (f.includes("YELLOW")) return "#eab308";
  if (f === "GREEN") return "#22c55e";
  if (f === "CHEQUERED") return "#e5e5e5";
  const m = e.message.toUpperCase();
  if (m.includes("SAFETY CAR") || m.includes("VSC")) return "#f97316";
  if (e.category === "Drs") return "#3b82f6";
  return "#525252";
};

const mmss = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

// last sample <= t, lerped toward the next; clamps at the ends.
const sampleAt = (arr: Pt[], t: number): Pt | null => {
  if (!arr.length) return null;
  if (t <= arr[0].t) return arr[0];
  if (t >= arr[arr.length - 1].t) return arr[arr.length - 1];
  let lo = 0,
    hi = arr.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (arr[mid].t <= t) lo = mid;
    else hi = mid - 1;
  }
  const a = arr[lo],
    b = arr[lo + 1];
  const f = (t - a.t) / (b.t - a.t || 1);
  return { t, x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
};

// a car is "out" once it sits still for DNF_GAP_MS — covers both retirements
// that stop transmitting and cars parked trackside that keep transmitting.
const STAT_EPS = 90; // track spans thousands of units; <90 = not moving
const stoppedFor = (arr: Pt[], t: number): boolean => {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity,
    count = 0;
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i].t > t) continue;
    if (arr[i].t < t - DNF_GAP_MS) break;
    minX = Math.min(minX, arr[i].x);
    maxX = Math.max(maxX, arr[i].x);
    minY = Math.min(minY, arr[i].y);
    maxY = Math.max(maxY, arr[i].y);
    count++;
  }
  if (count < 2) return false; // not enough samples; let the no-data rule decide
  return maxX - minX < STAT_EPS && maxY - minY < STAT_EPS;
};

// last position at or before t (discrete — positions don't interpolate)
const posAt = (arr: Pos[], t: number): number | null => {
  if (!arr.length || t < arr[0].t) return null;
  let lo = 0,
    hi = arr.length - 1,
    res: number | null = null;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid].t <= t) {
      res = arr[mid].position;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return res;
};

export const Replay: React.FC = () => {
  const year0 = new Date().getFullYear();
  const years = Array.from({ length: year0 - 2022 }, (_, i) => 2023 + i);

  const [year, setYear] = useState(year0);
  const [sessions, setSessions] = useState<OF1Session[]>([]);
  const [session, setSession] = useState<OF1Session | null>(null);
  const [drivers, setDrivers] = useState<OF1Driver[]>([]);
  const [bounds, setBounds] = useState<{
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  } | null>(null);
  const [trackPath, setTrackPath] = useState("");
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [posByDriver, setPosByDriver] = useState<Map<number, Pos[]>>(new Map());
  const [stints, setStints] = useState<Map<number, OF1Stint[]>>(new Map());
  const [cursor, setCursor] = useState(0); // ms from race start
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(4);
  const [threeD, setThreeD] = useState(false);
  const [rot, setRot] = useState({ x: 55, z: 0 }); // 3D camera: pitch, yaw
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const [status, setStatus] = useState("");
  const [, setVersion] = useState(0); // bump to re-render when a window loads while paused

  const points = useRef<Map<number, Pt[]>>(new Map());
  const loaded = useRef<Set<number>>(new Set());
  const inflight = useRef<Set<number>>(new Set());
  const cursorRef = useRef(0);
  const activeItemRef = useRef<HTMLLIElement>(null);

  const startMs = session ? Date.parse(session.date_start) : 0;
  const duration = session ? Date.parse(session.date_end) - startMs : 0;

  // --- session list for the chosen year ---
  useEffect(() => {
    let cancel = false;
    setStatus("Loading races…");
    fetchRaceSessions(year)
      .then((all) => {
        if (cancel) return;
        // only races that have already finished are replayable
        const now = Date.now();
        const s = all
          .filter((x) => Date.parse(x.date_end) < now)
          .sort((a, b) => Date.parse(a.date_start) - Date.parse(b.date_start));
        setSessions(s);
        setStatus(s.length ? "" : "No completed races for this year yet.");
      })
      .catch(() => !cancel && setStatus("Failed to load races."));
    return () => {
      cancel = true;
    };
  }, [year]);

  // --- load a session: reset buffers, fetch drivers + track outline ---
  const loadSession = async (s: OF1Session) => {
    setSession(s);
    setPlaying(false);
    setCursor(0);
    cursorRef.current = 0;
    points.current = new Map();
    loaded.current = new Set();
    inflight.current = new Set();
    setBounds(null);
    setTrackPath("");
    setFeed([]);
    setPosByDriver(new Map());
    setStints(new Map());
    setStatus("Loading track…");
    try {
      const [drv, outline, rc, pos, st] = await Promise.all([
        fetchDrivers(s.session_key),
        // first 3 min of one car traces the whole circuit (ponytail: cheap map)
        fetchLocations(
          s.session_key,
          new Date(s.date_start),
          new Date(Date.parse(s.date_start) + 180_000),
          1
        ).catch(() => [] as OF1Loc[]),
        fetchRaceControl(s.session_key).catch(() => [] as OF1RaceControl[]),
        fetchPositions(s.session_key).catch(() => [] as OF1Position[]),
        fetchStints(s.session_key).catch(() => [] as OF1Stint[]),
      ]);
      setDrivers(drv);
      setFeed(
        rc
          .map((e) => ({ ...e, t: Date.parse(e.date) }))
          .sort((a, b) => a.t - b.t)
      );
      const pm = new Map<number, Pos[]>();
      for (const p of pos) {
        const arr = pm.get(p.driver_number) || [];
        arr.push({ t: Date.parse(p.date), position: p.position });
        pm.set(p.driver_number, arr);
      }
      for (const arr of pm.values()) arr.sort((a, b) => a.t - b.t);
      setPosByDriver(pm);
      const sm = new Map<number, OF1Stint[]>();
      for (const x of st) {
        const arr = sm.get(x.driver_number) || [];
        arr.push(x);
        sm.set(x.driver_number, arr);
      }
      for (const arr of sm.values()) arr.sort((a, b) => a.lap_start - b.lap_start);
      setStints(sm);
      const pts = outline.filter((p) => p.x || p.y);
      if (pts.length) {
        const xs = pts.map((p) => p.x),
          ys = pts.map((p) => p.y);
        const b = {
          minX: Math.min(...xs),
          maxX: Math.max(...xs),
          minY: Math.min(...ys),
          maxY: Math.max(...ys),
        };
        setBounds(b);
        setTrackPath(buildPath(pts, b));
      }
      setStatus(pts.length ? "" : "No location data for this race.");
    } catch {
      setStatus("Failed to load session.");
    }
  };

  // project track x,y -> svg coords (y flipped, aspect preserved & centred)
  const project = useMemo(() => {
    if (!bounds) return null;
    const w = bounds.maxX - bounds.minX || 1;
    const h = bounds.maxY - bounds.minY || 1;
    const scale = (VIEW - 2 * PAD) / Math.max(w, h);
    const offX = (VIEW - w * scale) / 2;
    const offY = (VIEW - h * scale) / 2;
    return (x: number, y: number): [number, number] => [
      offX + (x - bounds.minX) * scale,
      offY + (bounds.maxY - y) * scale,
    ];
  }, [bounds]);

  // fetch a 60s window for all cars and merge into the per-driver buffers
  const ensureWindow = (idx: number) => {
    if (!session || idx < 0 || idx * WINDOW_MS > duration) return;
    if (loaded.current.has(idx) || inflight.current.has(idx)) return;
    inflight.current.add(idx);
    const from = new Date(startMs + idx * WINDOW_MS);
    const to = new Date(startMs + (idx + 1) * WINDOW_MS);
    fetchLocations(session.session_key, from, to)
      .then((locs) => {
        for (const l of locs) {
          if (!l.x && !l.y) continue;
          const arr = points.current.get(l.driver_number) || [];
          arr.push({ t: Date.parse(l.date), x: l.x, y: l.y });
          points.current.set(l.driver_number, arr);
        }
        for (const arr of points.current.values()) arr.sort((a, b) => a.t - b.t);
        loaded.current.add(idx);
        setVersion((v) => v + 1);
      })
      .catch(() => {})
      .finally(() => inflight.current.delete(idx));
  };

  // keep the current + next window warm whenever the cursor moves
  useEffect(() => {
    if (!session) return;
    const idx = Math.floor(cursor / WINDOW_MS);
    ensureWindow(idx);
    ensureWindow(idx + 1);
  }, [cursor, session]);

  // playback loop
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      let next = cursorRef.current + dt * speed;
      if (next >= duration) {
        next = duration;
        setPlaying(false);
      }
      cursorRef.current = next;
      setCursor(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, duration]);

  const scrub = (v: number) => {
    setPlaying(false);
    cursorRef.current = v;
    setCursor(v);
  };

  const toggle3D = () => {
    setRot({ x: 55, z: 0 });
    setThreeD((v) => !v);
  };

  // drag to orbit: vertical = pitch (rotateX), horizontal = yaw (rotateZ)
  const onDragStart = (e: React.PointerEvent) => {
    if (!threeD) return;
    dragRef.current = { x: e.clientX, y: e.clientY };
    setDragging(true);
  };
  const onDragMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    dragRef.current = { x: e.clientX, y: e.clientY };
    setRot((r) => ({
      x: Math.max(0, Math.min(85, r.x - dy * 0.4)),
      z: r.z + dx * 0.4,
    }));
  };
  const onDragEnd = () => {
    dragRef.current = null;
    setDragging(false);
  };

  const absT = startMs + cursor;
  // index of the latest feed event at or before the cursor
  let activeIdx = -1;
  for (let i = 0; i < feed.length; i++) {
    if (feed[i].t <= absT) activeIdx = i;
    else break;
  }

  // keep the current event in view as the race plays
  useEffect(() => {
    activeItemRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  // lap count derived from race-control events (no extra fetch)
  let currentLap = 0;
  for (let i = 0; i <= activeIdx; i++)
    if (feed[i].lap_number) currentLap = feed[i].lap_number!;
  const totalLaps = feed.reduce((m, e) => Math.max(m, e.lap_number || 0), 0);

  // a window we've actually loaded lets us trust "no data" as a retirement signal
  const curWindowLoaded = loaded.current.has(Math.floor(cursor / WINDOW_MS));

  const dots =
    project &&
    drivers
      .map((d) => {
        const arr = points.current.get(d.driver_number) || [];
        const p = sampleAt(arr, absT);
        if (!p) return null;
        // retired/DNF (skip the grid/start where everyone is briefly stationary):
        // data stopped, or the car has sat still for a while.
        if (curWindowLoaded && arr.length && cursor > 120_000) {
          const noData = absT - arr[arr.length - 1].t > DNF_GAP_MS;
          if (noData || stoppedFor(arr, absT)) return null;
        }
        const [cx, cy] = project(p.x, p.y);
        return { d, cx, cy };
      })
      .filter(Boolean) as { d: OF1Driver; cx: number; cy: number }[];

  // running order for the tower, from /position
  const order = drivers
    .map((d) => ({
      d,
      pos: posAt(posByDriver.get(d.driver_number) || [], absT),
    }))
    .filter((r): r is { d: OF1Driver; pos: number } => r.pos != null)
    .sort((a, b) => a.pos - b.pos);

  // current tyre stint for a driver at the current lap
  const stintFor = (num: number) => {
    const arr = stints.get(num);
    if (!arr || !currentLap) return null;
    let cur: OF1Stint | null = null;
    for (const s of arr) if (s.lap_start <= currentLap) cur = s;
    if (!cur) return null;
    return { ...cur, age: cur.tyre_age_at_start + (currentLap - cur.lap_start) };
  };

  return (
    <div className="h-screen overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 fade-in">
      <h1 className="text-2xl md:text-3xl font-bold text-white light:text-neutral-900 tracking-tight mb-1">
        Race Replay
      </h1>
      <p className="text-neutral-500 text-sm mb-6">
        Watch any race from 2023 onwards play out on track. Data: OpenF1.
      </p>

      {/* pickers */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="bg-neutral-900 light:bg-white border border-neutral-800 light:border-neutral-300 rounded-md px-3 py-2 text-sm text-neutral-200 light:text-neutral-800"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <select
          value={session?.session_key ?? ""}
          onChange={(e) => {
            const s = sessions.find(
              (x) => x.session_key === Number(e.target.value)
            );
            if (s) loadSession(s);
          }}
          className="bg-neutral-900 light:bg-white border border-neutral-800 light:border-neutral-300 rounded-md px-3 py-2 text-sm text-neutral-200 light:text-neutral-800 min-w-[200px]"
        >
          <option value="">Select a race…</option>
          {sessions.map((s) => (
            <option key={s.session_key} value={s.session_key}>
              {s.country_name} — {s.location}
            </option>
          ))}
        </select>
        {status && (
          <span className="text-neutral-500 text-sm self-center">{status}</span>
        )}
      </div>

      {session && trackPath && (
        <div className="flex flex-col lg:flex-row gap-4 max-w-6xl mx-auto">
          <div className="flex-1 min-w-0">
          <div
            className="bg-neutral-950 light:bg-white border border-neutral-800 light:border-neutral-200 rounded-xl p-2 md:p-4 relative"
            style={{ perspective: "1200px" }}
          >
            <button
              onClick={toggle3D}
              className="absolute top-3 right-3 z-10 px-3 py-1 rounded-md text-xs font-semibold bg-neutral-800 light:bg-neutral-200 text-neutral-200 light:text-neutral-800 hover:bg-neutral-700"
            >
              {threeD ? "3D" : "2D"}
            </button>
            <div className="absolute top-3 left-3 z-10 select-none pointer-events-none">
              <div className="text-neutral-500 light:text-neutral-400 text-[10px] font-medium tracking-wide">
                LAP
              </div>
              <div className="text-white light:text-neutral-900 text-xl font-bold tabular-nums leading-none">
                {currentLap || "—"}
                {totalLaps ? (
                  <span className="text-neutral-500 text-sm font-medium">
                    /{totalLaps}
                  </span>
                ) : null}
              </div>
            </div>
            {threeD && (
              <span className="absolute bottom-3 left-3 z-10 text-[10px] text-neutral-500 select-none pointer-events-none">
                drag to rotate
              </span>
            )}
            <div
              onPointerDown={onDragStart}
              onPointerMove={onDragMove}
              onPointerUp={onDragEnd}
              onPointerLeave={onDragEnd}
              style={{
                transform: threeD
                  ? `rotateX(${rot.x}deg) rotateZ(${rot.z}deg) scale(0.9)`
                  : "none",
                transformOrigin: "center",
                transition: dragging ? "none" : "transform 0.4s",
                cursor: threeD ? (dragging ? "grabbing" : "grab") : "default",
                touchAction: "none",
              }}
            >
            <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="w-full h-auto">
              <path
                d={trackPath}
                fill="none"
                stroke="currentColor"
                className="text-neutral-700 light:text-neutral-300"
                strokeWidth={14}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {dots?.map(({ d, cx, cy }) => (
                <g key={d.driver_number}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={13}
                    fill={`#${d.team_colour || "888888"}`}
                    stroke="#000"
                    strokeWidth={2}
                  />
                  <text
                    x={cx}
                    y={cy - 20}
                    textAnchor="middle"
                    className="fill-neutral-300 light:fill-neutral-700"
                    style={{ fontSize: 22, fontWeight: 700 }}
                  >
                    {d.name_acronym}
                  </text>
                </g>
              ))}
            </svg>
            </div>
          </div>

          {/* transport */}
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => setPlaying((p) => !p)}
              className="w-10 h-10 shrink-0 rounded-full bg-white light:bg-neutral-900 text-black light:text-white flex items-center justify-center"
            >
              <i className={`fas ${playing ? "fa-pause" : "fa-play"}`}></i>
            </button>
            <input
              type="range"
              min={0}
              max={duration}
              value={cursor}
              onChange={(e) => scrub(Number(e.target.value))}
              className="flex-1 accent-red-500"
            />
            <span className="text-neutral-400 text-sm font-mono tabular-nums shrink-0">
              {mmss(cursor)} / {mmss(duration)}
            </span>
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="bg-neutral-900 light:bg-white border border-neutral-800 light:border-neutral-300 rounded-md px-2 py-1 text-sm text-neutral-200 light:text-neutral-800"
            >
              {SPEEDS.map((s) => (
                <option key={s} value={s}>
                  {s}x
                </option>
              ))}
            </select>
          </div>
          </div>

          {/* right column: position tower + race control feed */}
          <div className="lg:w-80 shrink-0 flex flex-col gap-4">

          {/* position tower (order from /position, tyre from /stints) */}
          <div className="bg-neutral-950 light:bg-white border border-neutral-800 light:border-neutral-200 rounded-xl flex flex-col">
            <div className="px-4 py-3 border-b border-neutral-800 light:border-neutral-200 text-sm font-semibold text-white light:text-neutral-900">
              Running Order
            </div>
            {order.length === 0 ? (
              <p className="p-4 text-neutral-500 text-sm">No position data.</p>
            ) : (
              <ul className="overflow-y-auto p-2 max-h-[40vh] lg:max-h-[360px]">
                {order.map(({ d, pos }) => {
                  const st = stintFor(d.driver_number);
                  const tyre = st ? compound(st.compound) : null;
                  return (
                    <li
                      key={d.driver_number}
                      className="flex items-center gap-2 px-2 py-1.5 text-sm"
                    >
                      <span className="w-5 text-right text-neutral-500 light:text-neutral-400 font-mono text-xs tabular-nums">
                        {pos}
                      </span>
                      <span
                        className="w-1 h-5 rounded-full shrink-0"
                        style={{ backgroundColor: `#${d.team_colour || "888888"}` }}
                      />
                      <span className="font-semibold text-neutral-200 light:text-neutral-800 w-10">
                        {d.name_acronym}
                      </span>
                      {tyre && (
                        <span className="ml-auto flex items-center gap-1.5 text-xs text-neutral-400">
                          <span
                            className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-black"
                            style={{ backgroundColor: tyre.c }}
                          >
                            {tyre.l}
                          </span>
                          <span className="tabular-nums w-6 text-right">
                            {st!.age}L
                          </span>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* race control feed, synced to the cursor */}
          <div className="bg-neutral-950 light:bg-white border border-neutral-800 light:border-neutral-200 rounded-xl flex flex-col">
            <div className="px-4 py-3 border-b border-neutral-800 light:border-neutral-200 text-sm font-semibold text-white light:text-neutral-900">
              Race Control
            </div>
            {feed.length === 0 ? (
              <p className="p-4 text-neutral-500 text-sm">No race-control data.</p>
            ) : (
              <ul className="overflow-y-auto p-2 space-y-1 max-h-[40vh] lg:max-h-[600px]">
                {feed.map((e, i) => {
                  const past = i <= activeIdx;
                  return (
                    <li
                      key={i}
                      ref={i === activeIdx ? activeItemRef : undefined}
                      onClick={() => scrub(Math.max(0, e.t - startMs))}
                      title="Jump to this moment"
                      className={`flex gap-2 rounded-md px-2 py-1.5 text-xs cursor-pointer hover:bg-neutral-800 light:hover:bg-neutral-100 transition-opacity ${
                        past ? "opacity-100" : "opacity-40"
                      } ${i === activeIdx ? "bg-neutral-800/60 light:bg-neutral-100" : ""}`}
                    >
                      <span
                        className="mt-0.5 w-1 shrink-0 rounded-full"
                        style={{ backgroundColor: flagColor(e) }}
                      />
                      <div className="min-w-0">
                        <div className="text-neutral-500 light:text-neutral-400 font-mono text-[10px]">
                          {mmss(e.t - startMs)}
                          {e.lap_number ? ` · L${e.lap_number}` : ""}
                        </div>
                        <div className="text-neutral-300 light:text-neutral-700 leading-snug">
                          {e.message}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          </div>
        </div>
      )}
    </div>
  );
};

// "M x y L x y …" through the outline points, in time order
function buildPath(
  pts: OF1Loc[],
  b: { minX: number; minY: number; maxX: number; maxY: number }
): string {
  const w = b.maxX - b.minX || 1;
  const h = b.maxY - b.minY || 1;
  const scale = (VIEW - 2 * PAD) / Math.max(w, h);
  const offX = (VIEW - w * scale) / 2;
  const offY = (VIEW - h * scale) / 2;
  return pts
    .map((p, i) => {
      const x = offX + (p.x - b.minX) * scale;
      const y = offY + (b.maxY - p.y) * scale;
      return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}
