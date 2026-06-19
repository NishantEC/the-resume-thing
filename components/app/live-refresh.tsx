"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Re-fetches the current route's server data on an interval so the console
 * reflects what the background worker streams into the DB. Pauses while the
 * tab is hidden and refreshes immediately on re-focus.
 */
export function LiveRefresh({ intervalMs = 20000 }: { intervalMs?: number }): null {
  const router = useRouter();
  useEffect(() => {
    const tick = (): void => {
      if (!document.hidden) router.refresh();
    };
    const timer = setInterval(tick, intervalMs);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [router, intervalMs]);
  return null;
}
