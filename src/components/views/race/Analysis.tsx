import React, { useState } from "react";
import type { PitStop, RaceResult } from "../../../types";
import { Tabs } from "../../shared";
import { Strategy } from "./Strategy";
import { LapChart } from "./LapChart";
import { PitStops } from "./PitStops";

type Tab = "strategy" | "laps" | "pits";

// Race analysis under one heading: tyre strategy and lap chart (OpenF1, 2023
// on) and pit stops (jolpi, 2011 on). Tabs without data are left out.
export const Analysis: React.FC<{
  season: string;
  date: string;
  results: RaceResult[];
  stops: PitStop[];
}> = ({ season, date, results, stops }) => {
  const options: [Tab, string][] = [
    ...(parseInt(season) >= 2023
      ? ([
          ["strategy", "Tyre strategy"],
          ["laps", "Lap chart"],
        ] as [Tab, string][])
      : []),
    ...(stops.length ? ([["pits", "Pit stops"]] as [Tab, string][]) : []),
  ];
  const [tab, setTab] = useState<Tab | null>(null);
  if (!options.length) return null;
  const current = options.some(([t]) => t === tab) ? tab! : options[0][0];

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wide">Race analysis</h3>
        {options.length > 1 && (
          <Tabs label="Analysis" size="sm" value={current} onChange={setTab} options={options} />
        )}
      </div>
      {current === "strategy" && <Strategy season={season} date={date} results={results} />}
      {current === "laps" && <LapChart season={season} date={date} results={results} />}
      {current === "pits" && <PitStops stops={stops} results={results} />}
    </section>
  );
};
