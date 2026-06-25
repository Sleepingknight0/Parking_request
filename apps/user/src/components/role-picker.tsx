"use client";

import { ClipboardList, Megaphone, ShieldCheck } from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@nacc/ui";
import { TH } from "@nacc/types";
import {
  enterCommsMode,
  enterOfficerMode,
  enterSecurityMode,
} from "@/lib/mode-actions";

const modes = [
  {
    key: "officer" as const,
    title: "เจ้าหน้าที่",
    description: "บันทึกหนังสือราชการ ขอที่จอดรถ และติดตามสถานะคำขอ",
    action: enterOfficerMode,
    icon: ClipboardList,
    accent: "bg-blue-50 text-blue-700",
  },
  {
    key: "comms" as const,
    title: "พนักงานสื่อสาร",
    description: "ดูและจัดการหนังสือราชการ ติดตามสถานะงาน และประสานงาน",
    action: enterCommsMode,
    icon: Megaphone,
    accent: "bg-violet-50 text-violet-700",
  },
  {
    key: "security" as const,
    title: "เจ้าหน้าที่ รปภ.",
    description: "รับงานและส่งงานอย่างรวดเร็ว — ออกแบบให้ใช้งานง่าย",
    action: enterSecurityMode,
    icon: ShieldCheck,
    accent: "bg-emerald-50 text-emerald-700",
  },
];

export function RolePicker({ error }: { error?: string }) {
  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <Card key={mode.key} className="border-slate-200">
              <CardHeader className="gap-3">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-xl ${mode.accent}`}
                >
                  <Icon className="h-7 w-7" aria-hidden="true" />
                </div>
                <div>
                  <CardTitle className="text-xl">{mode.title}</CardTitle>
                  <CardDescription className="mt-2 text-base leading-relaxed">
                    {mode.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <form action={mode.action}>
                  <Button type="submit" className="h-12 w-full text-base">
                    เข้าใช้งาน
                  </Button>
                </form>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <p className="text-center text-sm text-slate-500">
        {TH.app.userName} — ไม่ต้องกรอกรหัสผ่าน เลือกบทบาทแล้วเริ่มใช้งานได้ทันที
      </p>
    </div>
  );
}
