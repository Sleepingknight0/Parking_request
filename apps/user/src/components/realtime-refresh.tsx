"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@nacc/db/client";

const REFRESH_COOLDOWN_MS = 2500;

export function RealtimeRefresh({
  table = "parking_requests",
}: {
  table?: string;
}) {
  const router = useRouter();
  const lastRefreshRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const scheduleRefresh = () => {
      const now = Date.now();
      const elapsed = now - lastRefreshRef.current;

      const run = () => {
        lastRefreshRef.current = Date.now();
        router.refresh();
      };

      if (elapsed >= REFRESH_COOLDOWN_MS) {
        run();
        return;
      }

      if (timerRef.current) return;
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        run();
      }, REFRESH_COOLDOWN_MS - elapsed);
    };

    const channel = supabase
      .channel(`user-realtime:${table}`)
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
  }, [router, table]);

  return null;
}
