"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@nacc/ui";

/**
 * Automatic data refresh on a fixed interval (replaces the manual refresh button).
 *
 * Uses a simple timer + router.refresh() instead of a Supabase realtime
 * subscription — predictable load, no event storms. Pauses while the tab is
 * hidden and never overlaps refreshes, so it stays light.
 */
export function AutoRefresh({ intervalMs = 5000 }: { intervalMs?: number }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const busyRef = React.useRef(false);

  React.useEffect(() => {
    let cancelled = false;
    let resetTimer: ReturnType<typeof setTimeout> | null = null;

    const tick = () => {
      if (cancelled || busyRef.current) return;
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;

      busyRef.current = true;
      setBusy(true);
      router.refresh();

      resetTimer = setTimeout(() => {
        busyRef.current = false;
        if (!cancelled) setBusy(false);
      }, Math.min(1200, intervalMs - 100));
    };

    const id = setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
      if (resetTimer) clearTimeout(resetTimer);
    };
  }, [router, intervalMs]);

  const seconds = Math.round(intervalMs / 1000);

  return (
    <span
      className="flex items-center gap-1.5 text-xs text-muted-foreground"
      title={`อัปเดตข้อมูลอัตโนมัติทุก ${seconds} วินาที`}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full bg-emerald-500",
          busy ? "animate-ping" : "animate-pulse",
        )}
        aria-hidden="true"
      />
      <span className="hidden sm:inline">อัปเดตอัตโนมัติ</span>
    </span>
  );
}
