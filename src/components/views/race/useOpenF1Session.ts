import { useEffect, useState } from "react";
import { fetchRaceSessions, type OF1Session } from "../../../services/openf1";

// The OpenF1 race session for an Ergast race, matched by date (OpenF1 starts
// in 2023). undefined = still looking, null = none.
export const useOpenF1Session = (season: string, date: string) => {
  const [session, setSession] = useState<OF1Session | null | undefined>(undefined);
  useEffect(() => {
    if (parseInt(season) < 2023) return setSession(null);
    let stale = false;
    setSession(undefined);
    fetchRaceSessions(parseInt(season))
      .then((all) => !stale && setSession(all.find((s) => s.date_start.slice(0, 10) === date) ?? null))
      .catch(() => !stale && setSession(null));
    return () => {
      stale = true;
    };
  }, [season, date]);
  return session;
};
