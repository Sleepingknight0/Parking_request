"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  ClipboardList,
  FileText,
  Home,
  Menu,
  PlusCircle,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  Button,
  cn,
} from "@nacc/ui";
import { TH } from "@nacc/types";
import { USER_MODE_LABELS_TH, type UserAppMode } from "@/lib/user-mode";
import { RealtimeRefresh } from "./realtime-refresh";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const OFFICER_NAV: NavItem[] = [
  { href: "/officer/dashboard", label: TH.nav.officerDashboard, icon: Home },
  { href: "/officer/requests", label: TH.nav.myRequests, icon: FileText },
  { href: "/officer/requests/new", label: TH.action.recordLetter, icon: PlusCircle },
];

const COMMS_NAV: NavItem[] = [
  { href: "/comms/dashboard", label: "หน้าหลักสื่อสาร", icon: Home },
  { href: "/comms/requests", label: "หนังสือและคำขอ", icon: ClipboardList },
];

const SECURITY_NAV: NavItem[] = [
  { href: "/security/dashboard", label: TH.nav.securityDashboard, icon: ShieldCheck },
  { href: "/security/jobs", label: TH.nav.jobs, icon: ClipboardList },
  { href: "/security/history", label: TH.nav.history, icon: FileText },
];

export function UserShell({
  mode,
  switchRole,
  children,
}: {
  profile: { display_name: string };
  mode: UserAppMode;
  switchRole: () => Promise<void>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const nav =
    mode === "officer" ? OFFICER_NAV : mode === "comms" ? COMMS_NAV : SECURITY_NAV;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const navList = (
    <nav className="flex flex-col gap-1 p-3">
      {nav.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive(item.href)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <div className="flex h-16 items-center gap-2 border-b border-border px-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
        ป.
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold">ระบบขอที่จอดรถ</div>
        <div className="text-xs text-muted-foreground">{USER_MODE_LABELS_TH[mode]}</div>
      </div>
    </div>
  );

  const bottomCols = nav.length <= 2 ? nav.length : 3;

  return (
    <div className="min-h-screen bg-muted/20 pb-16 lg:pb-0">
      <RealtimeRefresh />

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card lg:flex">
        {brand}
        <div className="flex-1 overflow-y-auto">{navList}</div>
        <div className="border-t border-border p-3">
          <form action={switchRole}>
            <Button type="submit" variant="outline" className="w-full gap-2">
              <ArrowLeftRight className="h-4 w-4" />
              เปลี่ยนบทบาท
            </Button>
          </form>
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border pr-2">
              {brand}
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">{navList}</div>
            <div className="border-t border-border p-3">
              <form action={switchRole}>
                <Button type="submit" variant="outline" className="w-full gap-2">
                  <ArrowLeftRight className="h-4 w-4" />
                  เปลี่ยนบทบาท
                </Button>
              </form>
            </div>
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="ml-auto lg:hidden">
            <form action={switchRole}>
              <Button type="submit" variant="outline" size="sm" className="gap-2">
                <ArrowLeftRight className="h-4 w-4" />
                เปลี่ยนบทบาท
              </Button>
            </form>
          </div>
        </header>

        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {nav.length > 1 ? (
        <nav
          className="fixed inset-x-0 bottom-0 z-30 grid border-t border-border bg-card lg:hidden"
          style={{ gridTemplateColumns: `repeat(${bottomCols}, minmax(0, 1fr))` }}
        >
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-[11px]",
                  isActive(item.href) ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="line-clamp-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
