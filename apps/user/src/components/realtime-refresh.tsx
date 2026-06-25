"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@nacc/db/client";

export function RealtimeRefresh({
  table = "parking_requests",
}: {
  table?: string;
}) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`user-realtime:${table}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router, table]);

  return null;
}
