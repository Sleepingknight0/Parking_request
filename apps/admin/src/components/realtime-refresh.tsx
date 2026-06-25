"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@nacc/db/client";

/**
 * Subscribes to changes on a table and calls router.refresh() so server
 * components re-fetch. Used on the dashboard, request list, and assignments.
 */
export function RealtimeRefresh({
  table = "parking_requests",
}: {
  table?: string;
}) {
  const router = useRouter();
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`realtime:${table}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => router.refresh(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [table, router]);
  return null;
}
