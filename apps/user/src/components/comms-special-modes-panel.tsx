"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Sparkles, Zap } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, cn, toast } from "@nacc/ui";
import { TH } from "@nacc/types";
import { toggleCommsAutoApprove, toggleCommsAutoVerify } from "@/lib/comms-actions";
import type { CommsOperationalSettings } from "@/lib/comms-operational-settings";

function ModeToggle({
  title,
  description,
  warning,
  enabled,
  pending,
  onToggle,
  icon: Icon,
  accentClass,
}: {
  title: string;
  description: string;
  warning: string;
  enabled: boolean;
  pending: boolean;
  onToggle: (next: boolean) => void;
  icon: React.ComponentType<{ className?: string }>;
  accentClass: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border-2 p-3.5 transition-colors sm:p-4",
        enabled ? "border-amber-400 bg-amber-50/80" : "border-slate-200 bg-white",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            accentClass,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-bold text-slate-900 sm:text-base">{title}</p>
          <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">{description}</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant={enabled ? "default" : "outline"}
          disabled={pending}
          className={cn(
            "h-9 min-w-[4.5rem] shrink-0 font-semibold",
            enabled && "bg-amber-600 hover:bg-amber-700",
          )}
          onClick={() => onToggle(!enabled)}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : enabled ? (
            TH.comms.modeOn
          ) : (
            TH.comms.modeOff
          )}
        </Button>
      </div>
      {enabled ? (
        <p className="mt-3 flex items-start gap-1.5 text-xs font-medium leading-snug text-red-700">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {warning}
        </p>
      ) : null}
    </div>
  );
}

export function CommsSpecialModesPanel({
  initialSettings,
}: {
  initialSettings: CommsOperationalSettings;
}) {
  const router = useRouter();
  const [settings, setSettings] = React.useState(initialSettings);
  const [pendingKey, setPendingKey] = React.useState<"approve" | "verify" | null>(null);

  React.useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  const anyEnabled =
    settings.auto_approve_incoming || settings.auto_verify_security_work;

  async function runToggle(
    key: "approve" | "verify",
    enabled: boolean,
    fn: (value: boolean) => Promise<{ ok: boolean; error?: string; settings?: CommsOperationalSettings }>,
  ) {
    setPendingKey(key);
    try {
      const res = await fn(enabled);
      if (!res.ok) {
        toast.error(res.error ?? "บันทึกการตั้งค่าไม่สำเร็จ");
        return;
      }
      if (res.settings) setSettings(res.settings);
      toast.success(enabled ? "เปิดโหมดพิเศษแล้ว" : "ปิดโหมดพิเศษแล้ว");
      router.refresh();
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <Card className="overflow-hidden border-2 border-violet-300 bg-gradient-to-br from-violet-50 via-white to-amber-50/40 shadow-md">
      <CardHeader className="space-y-1 border-b border-violet-200/80 bg-violet-100/50 pb-3 pt-4">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base text-violet-950 sm:text-lg">
          <Sparkles className="h-5 w-5 text-violet-700" />
          {TH.comms.specialModesTitle}
          <span className="rounded-full border border-violet-300 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-800">
            {TH.comms.serverLevelBadge}
          </span>
        </CardTitle>
        <p className="text-xs text-violet-800/80 sm:text-sm">{TH.comms.specialModesHint}</p>
        {anyEnabled ? (
          <p className="flex items-start gap-1.5 text-xs font-medium leading-snug text-red-700">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {TH.comms.serverActiveNote}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3 p-3 sm:p-4">
        <ModeToggle
          title={TH.comms.autoApproveTitle}
          description={TH.comms.autoApproveDesc}
          warning={TH.comms.autoApproveWarning}
          enabled={settings.auto_approve_incoming}
          pending={pendingKey === "approve"}
          onToggle={(next) => runToggle("approve", next, toggleCommsAutoApprove)}
          icon={Zap}
          accentClass="bg-violet-100 text-violet-700"
        />
        <ModeToggle
          title={TH.comms.autoVerifyTitle}
          description={TH.comms.autoVerifyDesc}
          warning={TH.comms.autoVerifyWarning}
          enabled={settings.auto_verify_security_work}
          pending={pendingKey === "verify"}
          onToggle={(next) => runToggle("verify", next, toggleCommsAutoVerify)}
          icon={Sparkles}
          accentClass="bg-amber-100 text-amber-800"
        />
      </CardContent>
    </Card>
  );
}
