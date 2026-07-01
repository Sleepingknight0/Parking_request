"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  CalendarDays,
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

const SWITCH_ROLE_ACTION = "/api/auth/switch-role";

interface NavItem {
  href: string;
  label: string;
  shortLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
}

const OFFICER_NAV: NavItem[] = [
  { href: "/officer/dashboard", label: TH.nav.officerDashboard, shortLabel: TH.nav.officerDashboardShort, icon: Home },
  { href: "/officer/calendar", label: TH.nav.parkingCalendar, shortLabel: TH.nav.parkingCalendarShort, icon: CalendarDays },
  { href: "/officer/requests", label: TH.nav.officerRequests, shortLabel: TH.nav.officerRequestsShort, icon: FileText },
  { href: "/officer/requests/new", label: TH.action.recordLetter, shortLabel: TH.nav.recordLetterShort, icon: PlusCircle },
];

const COMMS_NAV: NavItem[] = [
  { href: "/comms/dashboard", label: "หน้าหลักสื่อสาร", shortLabel: "หน้าหลัก", icon: Home },
  { href: "/comms/calendar", label: TH.nav.parkingCalendar, shortLabel: TH.nav.parkingCalendarShort, icon: CalendarDays },
  { href: "/comms/requests", label: "หนังสือและคำขอ", shortLabel: "รายการ", icon: ClipboardList },
  { href: "/comms/requests/new", label: TH.comms.recordLetter, shortLabel: TH.nav.commsRecordLetterShort, icon: PlusCircle },
];

const SECURITY_NAV: NavItem[] = [
  { href: "/security/dashboard", label: TH.nav.securityDashboard, shortLabel: "หน้าหลัก", icon: ShieldCheck },
  { href: "/security/calendar", label: TH.nav.securityParkingCalendar, shortLabel: TH.nav.parkingCalendarShort, icon: CalendarDays },
  { href: "/security/jobs", label: TH.nav.jobs, shortLabel: "งาน", icon: ClipboardList },
  { href: "/security/history", label: TH.nav.history, shortLabel: "ประวัติ", icon: FileText },
];

/** Highlight only the most specific nav item (fixes /requests vs /requests/new). */
function isNavItemActive(pathname: string, href: string, nav: NavItem[]): boolean {
  const matches = nav.filter(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  if (!matches.length) return false;
  const best = matches.reduce((a, b) => (a.href.length >= b.href.length ? a : b));
  return best.href === href;
}

export function UserShell({
  mode,
  children,
}: {
  profile: { display_name: string };
  mode: UserAppMode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const nav =
    mode === "officer" ? OFFICER_NAV : mode === "comms" ? COMMS_NAV : SECURITY_NAV;

  const navList = (compact?: boolean) => (
    <nav className="flex flex-col gap-1 p-3">
      {nav.map((item) => {
        const Icon = item.icon;
        const active = isNavItemActive(pathname, item.href, nav);
        const text = compact ? (item.shortLabel ?? item.label) : item.label;
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="min-w-0 truncate">{text}</span>
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <div className="flex h-14 min-w-0 flex-1 items-center gap-2 px-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
        ป.
      </div>
      <div className="min-w-0 leading-tight">
        <div className="truncate text-sm font-semibold">ระบบขอที่จอดรถ</div>
        <div className="truncate text-xs text-muted-foreground">{USER_MODE_LABELS_TH[mode]}</div>
      </div>
    </div>
  );

  const bottomCols = Math.min(nav.length, 4);

  return (
    <div className="min-h-screen bg-muted/20 pb-16 lg:pb-0">
      <RealtimeRefresh />

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="border-b border-border">{brand}</div>
        <div className="flex-1 overflow-y-auto">{navList(false)}</div>
        <div className="border-t border-border p-3">
          <form action={SWITCH_ROLE_ACTION} method="POST">
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
            <div className="flex items-center border-b border-border pr-1">
              {brand}
              <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">{navList(true)}</div>
            <div className="border-t border-border p-3">
              <form action={SWITCH_ROLE_ACTION} method="POST">
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
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-card/80 px-3 backdrop-blur sm:px-4">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="ml-auto lg:hidden">
            <form action={SWITCH_ROLE_ACTION} method="POST">
              <Button type="submit" variant="outline" size="sm" className="gap-1.5 text-xs">
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
          className="fixed inset-x-0 bottom-0 z-30 grid border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
          style={{ gridTemplateColumns: `repeat(${bottomCols}, minmax(0, 1fr))` }}
        >
          {nav.map((item) => {
            const Icon = item.icon;
            const active = isNavItemActive(pathname, item.href, nav);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  "flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 px-0.5 py-1.5 text-[10px] leading-tight",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "stroke-[2.5px]")} />
                <span className="max-w-full truncate px-0.5">
                  {item.shortLabel ?? item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
