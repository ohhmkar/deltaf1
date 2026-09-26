import React, { useEffect, useState } from "react";
import { fetchData } from "../../../services/api";
import { getTeamHex } from "../../../utils/helpers";
import type { RaceResult } from "../../../types";
import { ResultsTable } from "./ResultsTable";
import { Tabs } from "../../shared";

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
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-display font-bold text-2xl text-white leading-none">Results</h2>
        <Tabs label="Session" size="sm" value={tab} onChange={setTab} options={tabs} />
      </div>
      {tab === "race" ? (
        <ResultsTable results={race} stopsByDriver={stopsByDriver} />
      ) : current === "error" ? (
        <p className="py-8 text-sm text-neutral-500">Couldn't load this session. Switch tabs to retry.</p>
      ) : !current ? (
        <div className="min-h-[300px] rounded-xl bg-neutral-900/50 animate-pulse" />
      ) : !current.length ? (
        <p className="py-8 text-sm text-neutral-500">No results recorded for this session.</p>
      ) : tab === "sprint" ? (
        <ResultsTable results={current} />
      ) : (
        <QualiTable rows={current} />
      )}
    </section>
  );
};

const QualiTable: React.FC<{ rows: QualiRow[] }> = ({ rows }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="text-xs text-neutral-500 border-b border-neutral-800">
          <th className="py-2 pr-2 text-left font-normal w-10"><span className="sr-only">Position</span></th>
          <th className="py-2 px-2 text-left font-normal">Driver</th>
          {["Q1", "Q2", "Q3"].map((q) => (
            <th key={q} className="py-2 px-2 text-right font-normal">{q}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.Driver.driverId} className="border-b border-neutral-800/60 last:border-0 hover:bg-neutral-900/60">
            <td className="py-2.5 pr-2 font-display font-bold text-lg leading-none text-neutral-400">{r.position}</td>
            <td className="py-2.5 px-2">
              <span className="flex items-center gap-2.5">
                <span
                  className="w-1 h-5 rounded-full shrink-0"
                  style={{ backgroundColor: getTeamHex(r.Constructor.constructorId) }}
                />
                <span className="sm:hidden font-display font-bold uppercase text-base text-white">
                  {r.Driver.code ?? r.Driver.familyName}
                </span>
                <span className="hidden sm:inline">
                  <span className="text-neutral-400">{r.Driver.givenName} </span>
                  <span className="font-display font-bold uppercase text-base text-white">{r.Driver.familyName}</span>
                </span>
              </span>
            </td>
            {(["Q1", "Q2", "Q3"] as const).map((q) => (
              <td key={q} className="py-2.5 px-2 text-right font-display text-base text-neutral-200 whitespace-nowrap">
                {r[q] || <span className="text-neutral-700">-</span>}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
