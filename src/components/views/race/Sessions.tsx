import React, { useEffect, useState } from "react";
import { fetchData } from "../../../services/api";
import { getTeamHex } from "../../../utils/helpers";
import type { RaceResult } from "../../../types";
import { ResultsTable } from "./ResultsTable";

type Tab = "race" | "qualifying" | "sprint";
type QualiRow = RaceResult & { Q1?: string; Q2?: string; Q3?: string };

// Race / Qualifying / Sprint classifications. The race comes in via props (the
// page already has it); the other two are fetched when their tab is opened.
export const Sessions: React.FC<{
  year: number;
  round: string;
  race: RaceResult[];
  stopsByDriver: Record<string, number>;
  hasSprint: boolean;
}> = ({ year, round, race, stopsByDriver, hasSprint }) => {
  const [tab, setTab] = useState<Tab>("race");
  const [rows, setRows] = useState<Record<string, QualiRow[] | "error">>({});

  useEffect(() => setRows({}), [year, round]);
  useEffect(() => {
    if (tab === "race" || rows[tab]) return;
    const key = tab === "sprint" ? "SprintResults" : "QualifyingResults";
    fetchData(`/${year}/${round}/${tab}.json`)
      .then((d) => setRows((r) => ({ ...r, [tab]: d?.RaceTable?.Races?.[0]?.[key] ?? [] })))
      .catch(() => setRows((r) => ({ ...r, [tab]: "error" })));
  }, [tab, year, round, rows]);

  const tabs: [Tab, string][] = [
    ["race", "Race"],
    ["qualifying", "Qualifying"],
    ...(hasSprint ? ([["sprint", "Sprint"]] as [Tab, string][]) : []),
  ];
  const current = tab === "race" ? null : rows[tab];

  return (
    <section>
      <div className="flex items-center gap-1 mb-4" role="tablist">
        {tabs.map(([t, label]) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              tab === t ? "bg-neutral-800 text-white font-medium" : "text-neutral-500 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "race" ? (
        <ResultsTable results={race} stopsByDriver={stopsByDriver} />
      ) : current === "error" ? (
        <p className="minimal-card p-5 text-sm text-neutral-500">Couldn't load this session.</p>
      ) : !current ? (
        <div className="minimal-card p-5 min-h-[300px] animate-pulse" />
      ) : !current.length ? (
        <p className="minimal-card p-5 text-sm text-neutral-500">No data for this session.</p>
      ) : tab === "sprint" ? (
        <ResultsTable results={current} />
      ) : (
        <QualiTable rows={current} />
      )}
    </section>
  );
};

const QualiTable: React.FC<{ rows: QualiRow[] }> = ({ rows }) => (
  <div className="minimal-card p-0 overflow-hidden">
    <table className="w-full text-sm">
      <thead>
        <tr className="text-[10px] uppercase tracking-wider text-neutral-500 border-b border-neutral-800">
          <th className="py-2 pl-3 pr-1 text-left font-medium w-10">Pos</th>
          <th className="py-2 px-2 text-left font-medium">Driver</th>
          {["Q1", "Q2", "Q3"].map((q) => (
            <th key={q} className="py-2 px-2 text-right font-medium">{q}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.Driver.driverId} className="border-b border-neutral-800/50 last:border-0">
            <td className="py-2 pl-3 pr-1 font-mono font-bold text-neutral-500">{r.position}</td>
            <td className="py-2 px-2">
              <span className="flex items-center gap-2 font-semibold text-white">
                <span
                  className="w-1 h-6 rounded-full shrink-0"
                  style={{ backgroundColor: getTeamHex(r.Constructor.constructorId) }}
                />
                <span className="sm:hidden">{r.Driver.code ?? r.Driver.familyName}</span>
                <span className="hidden sm:inline">
                  {r.Driver.givenName} {r.Driver.familyName}
                </span>
              </span>
            </td>
            {(["Q1", "Q2", "Q3"] as const).map((q) => (
              <td key={q} className="py-2 px-2 text-right font-mono text-xs text-neutral-300 whitespace-nowrap">
                {r[q] || <span className="text-neutral-700">-</span>}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
