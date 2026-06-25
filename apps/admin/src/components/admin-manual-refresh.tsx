"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button, cn } from "@nacc/ui";

/** Manual refresh — avoids global realtime router.refresh() loops that freeze the UI. */
export function AdminManualRefresh() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function refresh() {
    if (pending) return;
    setPending(true);
    router.refresh();
    timerRef.current = setTimeout(() => setPending(false), 1200);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      title="อัปเดตข้อมูล"
      aria-label="อัปเดตข้อมูล"
      disabled={pending}
      onClick={refresh}
    >
      <RefreshCw className={cn("h-4 w-4", pending && "animate-spin")} />
    </Button>
  );
}
