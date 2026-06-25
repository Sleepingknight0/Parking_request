"use client";

import { ClipboardList, Megaphone, Settings2, ShieldCheck } from "lucide-react";
import { cn } from "@nacc/ui";
import { ROLE_LABELS_TH, TH } from "@nacc/types";
import {
  enterCommsMode,
  enterOfficerMode,
  enterSecurityMode,
  enterSuperAdminMode,
} from "@/lib/mode-actions";

const modes = [
  {
    key: "officer" as const,
    title: "เจ้าหน้าที่",
    description: "บันทึกหนังสือและติดตามคำขอร่วมกัน",
    action: enterOfficerMode,
    icon: ClipboardList,
    accent: "bg-blue-50 text-blue-700",
  },
  {
    key: "comms" as const,
    title: "พนักงานสื่อสาร",
    description: "ดูหนังสือและติดตามสถานะงาน",
    action: enterCommsMode,
    icon: Megaphone,
    accent: "bg-violet-50 text-violet-700",
  },
  {
    key: "security" as const,
    title: "เจ้าหน้าที่ รปภ.",
    description: "รับงานและส่งงานอย่างรวดเร็ว",
    action: enterSecurityMode,
    icon: ShieldCheck,
    accent: "bg-emerald-50 text-emerald-700",
  },
  {
    key: "super_admin" as const,
    title: ROLE_LABELS_TH.super_admin,
    description: "แดชบอร์ด รายงาน และจัดการระบบ",
    action: enterSuperAdminMode,
    icon: Settings2,
    accent: "bg-amber-50 text-amber-800",
  },
];

export function RolePicker({ error }: { error?: string }) {
  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <section className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <form key={mode.key} action={mode.action} className="min-w-0">
              <button
                type="submit"
                className={cn(
                  "flex h-full w-full min-h-[9.5rem] flex-col rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition-colors",
                  "hover:border-primary/30 hover:bg-slate-50 active:bg-slate-100",
                )}
              >
                <div
                  className={cn(
                    "mb-2 flex h-9 w-9 items-center justify-center rounded-lg",
                    mode.accent,
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="text-sm font-semibold leading-tight text-slate-900">
                  {mode.title}
                </span>
                <span className="mt-1 line-clamp-2 flex-1 text-xs leading-snug text-slate-500">
                  {mode.description}
                </span>
                <span className="mt-2 inline-flex h-8 w-full items-center justify-center rounded-md bg-primary text-xs font-medium text-primary-foreground">
                  เข้าใช้งาน
                </span>
              </button>
            </form>
          );
        })}
      </section>

      <p className="text-center text-xs text-slate-500">
        {TH.app.userName} — เลือกบทบาทแล้วเข้าใช้งานได้ทันที (ไม่ต้องล็อกอิน)
      </p>
    </div>
  );
}
