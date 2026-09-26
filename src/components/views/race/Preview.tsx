import React, { useEffect, useState } from "react";
import { fetchData } from "../../../services/api";
import { getTeamHex, localTzLabel, raceStart } from "../../../utils/helpers";
import type { Race, RaceResult } from "../../../types";

const SESSIONS: [keyof Race, string][] = [
  ["FirstPractice", "Practice 1"],
  ["SecondPractice", "Practice 2"],
  ["ThirdPractice", "Practice 3"],
  ["SprintQualifying", "Sprint Qualifying"],
  ["Sprint", "Sprint"],
  ["Qualifying", "Qualifying"],
];

const when = (date: string, time?: string) =>
  time
    ? new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(`${date}T${time}`))
    : new Date(`${date}T12:00:00Z`).toLocaleDateString(undefined, { day: "numeric", month: "short" });

const countdown = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 86400)}d ${Math.floor((s % 86400) / 3600)}h ${Math.floor((s % 3600) / 60)}m ${s % 60}s`;
};

// A race without results yet: schedule, countdown, last year's podium here.
export const Preview: React.FC<{ race: Race }> = ({ race }) => {
  const [now, setNow] = useState(Date.now());
  const [lastYear, setLastYear] = useState<RaceResult[] | null>(null);
  const start = raceStart(race).getTime();

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let stale = false;
    setLastYear(null);
    fetchData(`/${parseInt(race.season) - 1}/circuits/${race.Circuit.circuitId}/results.json?limit=3`)
      .then((d) => !stale && setLastYear(d?.RaceTable?.Races?.[0]?.Results ?? []))
      .catch(() => !stale && setLastYear([]));
    return () => {
      stale = true;
    };
  }, [race.season, race.Circuit.circuitId]);

  const sessions = [
    ...SESSIONS.filter(([k]) => race[k]).map(([k, label]) => {
      const s = race[k] as { date: string; time?: string };
      return { label, date: s.date, time: s.time };
    }),
    { label: "Race", date: race.date, time: race.time },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div className="minimal-card p-6">
        <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-2">
          {start > now ? "Lights out in" : "Results"}
        </div>
        <div className="text-3xl md:text-4xl font-mono text-white tracking-tighter mb-6">
          {start > now ? countdown(start - now) : "Awaiting results"}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-2">
          Weekend schedule · {localTzLabel()}
        </div>
        <div className="space-y-1.5 text-sm">
          {sessions.map((s) => {
            const done = s.time && new Date(`${s.date}T${s.time}`).getTime() < now;
            return (
              <div
                key={s.label}
                className={`flex justify-between ${done ? "text-neutral-600" : "text-neutral-200"} ${
                  s.label === "Race" ? "font-semibold" : ""
                }`}
              >
                <span>{s.label}</span>
                <span className="font-mono text-xs">{when(s.date, s.time)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="minimal-card p-6">
        <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-3">
          Last year here · {parseInt(race.season) - 1}
        </div>
        {!lastYear ? (
          <div className="min-h-[120px] animate-pulse" />
        ) : !lastYear.length ? (
          <p className="text-sm text-neutral-500">No race here last year.</p>
        ) : (
          <div className="space-y-3">
            {lastYear.map((r) => (
              <div key={r.position} className="flex items-center gap-3">
                <span className="font-mono text-neutral-500 w-6">P{r.position}</span>
                <span
                  className="w-1 h-6 rounded-full"
                  style={{ backgroundColor: getTeamHex(r.Constructor.constructorId) }}
                />
                <div>
                  <div className="text-neutral-200 font-medium">
                    {r.Driver.givenName} {r.Driver.familyName}
                  </div>
                  <div className="text-[11px] text-neutral-500">{r.Constructor.name}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
