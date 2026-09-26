import React, { useEffect, useState } from "react";
import { fetchData } from "../../services/api";
import type { Race } from "../../types";

// ponytail: rough session lengths plus a margin; OpenF1 reopens a little after
// the session ends, so this is an estimate, not a promise
const LENGTH_MIN: Record<string, number> = { Race: 150, Sprint: 60 };
const SESSIONS: [keyof Race, string][] = [
  ["FirstPractice", "Practice 1"],
  ["SecondPractice", "Practice 2"],
  ["ThirdPractice", "Practice 3"],
  ["SprintQualifying", "Sprint Qualifying"],
  ["Sprint", "Sprint"],
  ["Qualifying", "Qualifying"],
];

type Live = { name: string; until: Date } | null;

// The session OpenF1's lockout is most likely for, from the jolpi schedule.
const findLive = (races: Race[]): Live => {
  const now = Date.now();
  for (const r of races) {
    const all = [
      ...SESSIONS.filter(([k]) => r[k]).map(([k, label]) => ({ label, s: r[k] as { date: string; time?: string } })),
      { label: "Race", s: { date: r.date, time: r.time } },
    ];
    for (const { label, s } of all) {
      if (!s.time) continue;
      const start = Date.parse(`${s.date}T${s.time}`);
      const end = start + (LENGTH_MIN[label] ?? 75) * 60_000;
      if (now >= start - 15 * 60_000 && now <= end + 30 * 60_000)
        return { name: `${r.raceName.replace("Grand Prix", "GP")} ${label}`, until: new Date(end + 30 * 60_000) };
    }
  }
  return null;
};

// Shown when OpenF1 can't be reached: during a live F1 session it blocks all
// public access (past races included); otherwise it's likely the connection.
export const LiveLockNotice: React.FC<{ className?: string }> = ({ className = "" }) => {
  const [live, setLive] = useState<Live | undefined>(undefined);
  useEffect(() => {
    fetchData("/current.json")
      .then((d) => setLive(findLive(d?.RaceTable?.Races ?? [])))
      .catch(() => setLive(null));
  }, []);
  const time = live?.until.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return (
    <div
      role="status"
      className={`flex gap-3 items-start rounded-lg border border-yellow-900/60 bg-yellow-950/30 light:bg-yellow-50 light:border-yellow-200 p-4 text-sm ${className}`}
    >
      <i className="fas fa-tower-broadcast text-yellow-500 mt-0.5"></i>
      <div className="text-neutral-300">
        {live ? (
          <>
            <span className="font-semibold text-white">{live.name} is live.</span> OpenF1, the
            data source for replays and charts, pauses public access during sessions. It
            should be back around <span className="font-semibold text-white">{time}</span>.
          </>
        ) : (
          <>
            Couldn't reach OpenF1, the data source for replays and charts. Check your
            connection and reload. OpenF1 also pauses public access during live F1 sessions.
          </>
        )}
      </div>
    </div>
  );
};
