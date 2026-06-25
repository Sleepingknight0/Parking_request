"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  CalendarDays,
  Building2,
  MapPin,
  Users,
  BarChart3,
  History,
  Upload,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
} from "lucide-react";
import {
  cn,
  Avatar,
  AvatarFallback,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@nacc/ui";
import { ROLE_LABELS_TH, TH, type Role } from "@nacc/types";
import { initials } from "@nacc/utils";
import { AdminManualRefresh } from "./admin-manual-refresh";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: Role[];
}

const ALL_NAV: NavItem[] = [
  { href: "/dashboard", label: TH.nav.dashboard, icon: LayoutDashboard },
  { href: "/requests", label: TH.nav.requests, icon: FileText },
  { href: "/calendar", label: TH.nav.calendar, icon: CalendarDays },
  { href: "/departments", label: TH.nav.departments, icon: Building2, roles: ["super_admin", "admin"] },
  { href: "/locations", label: TH.nav.locations, icon: MapPin, roles: ["super_admin", "admin"] },
  { href: "/users", label: TH.nav.users, icon: Users, roles: ["super_admin", "admin"] },
  { href: "/reports", label: TH.nav.reports, icon: BarChart3 },
  { href: "/activity", label: TH.nav.activityLogs, icon: History, roles: ["super_admin", "admin"] },
  { href: "/import", label: "นำเข้าข้อมูลเก่า", icon: Upload, roles: ["super_admin", "admin"] },
  { href: "/settings", label: TH.nav.settings, icon: Settings },
];

const BOTTOM_NAV: { href: string; label: string; icon: NavItem["icon"] }[] = [
  { href: "/dashboard", label: "หน้าหลัก", icon: LayoutDashboard },
  { href: "/requests", label: "คำขอ", icon: FileText },
  { href: "/calendar", label: "ปฏิทิน", icon: CalendarDays },
  { href: "/reports", label: "วิเคราะห์", icon: BarChart3 },
];

const MORE_MENU_HREFS = new Set(
  ALL_NAV.filter((item) => !BOTTOM_NAV.some((b) => b.href === item.href)).map((item) => item.href),
);

function navForRole(role: Role): NavItem[] {
  return ALL_NAV.filter((item) => !item.roles || item.roles.includes(role));
}

function isNavItemActive(pathname: string, href: string, nav: NavItem[]): boolean {
  const matches = nav.filter(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  if (!matches.length) return false;
  const best = matches.reduce((a, b) => (a.href.length >= b.href.length ? a : b));
  return best.href === href;
}

function isMoreMenuActive(pathname: string, nav: NavItem[]): boolean {
  return [...MORE_MENU_HREFS].some(
    (href) =>
      nav.some((item) => item.href === href) &&
      (pathname === href || pathname.startsWith(`${href}/`)),
  );
}

export function AppShell({
  profile,
  logout,
  children,
}: {
  profile: { display_name: string; role: Role };
  logout: () => Promise<void>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const nav = navForRole(profile.role);
  const moreActive = isMoreMenuActive(pathname, nav);

  const navList = (
    <nav className="flex flex-col gap-1 p-3">
      {nav.map((item) => {
        const Icon = item.icon;
        const active = isNavItemActive(pathname, item.href, nav);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="min-w-0 truncate">{item.label}</span>
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
        <div className="truncate text-xs text-muted-foreground">ผู้ดูแลระบบ</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/20 pb-[calc(4.25rem+env(safe-area-inset-bottom))] lg:pb-0">
      <aside className="fixed inset-y-0 right-auto left-0 z-30 hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-14 items-center border-b border-border">{brand}</div>
        <div className="flex-1 overflow-y-auto">{navList}</div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border pr-2">
              {brand}
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">{navList}</div>
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-border bg-card/80 px-4 backdrop-blur sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="ml-auto flex items-center gap-1">
            <AdminManualRefresh />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar>
                    <AvatarFallback>{initials(profile.display_name)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden text-right sm:block">
                    <span className="block text-sm font-medium leading-tight">
                      {profile.display_name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {ROLE_LABELS_TH[profile.role]}
                    </span>
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{profile.display_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ROLE_LABELS_TH[profile.role]}
                  </p>
                </div>
                <div className="my-1 h-px bg-muted" />
                <form action={logout}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-accent"
                  >
                    <LogOut className="h-4 w-4" />
                    {TH.action.logout}
                  </button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="mx-auto max-w-7xl p-4 pb-6 sm:p-6 sm:pb-8 lg:p-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
        {BOTTOM_NAV.map((item) => {
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
              <span className="max-w-full truncate px-0.5">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className={cn(
            "flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 px-0.5 py-1.5 text-[10px] leading-tight",
            moreActive || mobileOpen ? "text-primary" : "text-muted-foreground",
          )}
        >
          <Menu className={cn("h-5 w-5", (moreActive || mobileOpen) && "stroke-[2.5px]")} />
          <span className="max-w-full truncate px-0.5">เพิ่มเติม</span>
        </button>
      </nav>
    </div>
  );
}
