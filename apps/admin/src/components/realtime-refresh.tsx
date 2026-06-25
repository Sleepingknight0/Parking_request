"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@nacc/db/client";

/** Minimum gap between server refreshes triggered by realtime events. */
const REFRESH_COOLDOWN_MS = 8000;

/**
 * Subscribes to table changes and debounces router.refresh() so bursts of
 * realtime events do not remount the page in a loading loop.
 */
export function RealtimeRefresh({
  table = "parking_requests",
}: {
  table?: string;
}) {
  const router = useRouter();
  const routerRef = useRef(router);
  const lastRefreshRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshingRef = useRef(false);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    const supabase = createClient();

    const runRefresh = () => {
      if (refreshingRef.current) return;
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;

      refreshingRef.current = true;
      lastRefreshRef.current = Date.now();
      routerRef.current.refresh();

      window.setTimeout(() => {
        refreshingRef.current = false;
      }, REFRESH_COOLDOWN_MS);
    };

    const scheduleRefresh = () => {
      const now = Date.now();
      const elapsed = now - lastRefreshRef.current;

      if (elapsed >= REFRESH_COOLDOWN_MS) {
        runRefresh();
        return;
      }

      if (timerRef.current) return;
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        runRefresh();
      }, REFRESH_COOLDOWN_MS - elapsed);
    };

    const channel = supabase
      .channel(`admin-realtime:${table}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        scheduleRefresh,
      )
      .subscribe();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      void supabase.removeChannel(channel);
    };
  }, [table]);

  return null;
}
