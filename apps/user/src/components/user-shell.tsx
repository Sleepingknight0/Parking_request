"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  FileText,
  History,
  Home,
  LogOut,
  Menu,
  PlusCircle,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@nacc/ui";
import { ROLE_LABELS_TH, TH, type Role } from "@nacc/types";
import { initials } from "@nacc/utils";
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

const SECURITY_NAV: NavItem[] = [
  { href: "/security/dashboard", label: TH.nav.securityDashboard, icon: ShieldCheck },
  { href: "/security/jobs", label: TH.nav.jobs, icon: ClipboardList },
  { href: "/security/history", label: TH.nav.history, icon: History },
];

export function UserShell({
  profile,
  mode,
  logout,
  children,
}: {
  profile: { display_name: string; role: Role };
  mode: "officer" | "security";
  logout: () => Promise<void>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const nav = mode === "officer" ? OFFICER_NAV : SECURITY_NAV;

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
        <div className="text-xs text-muted-foreground">
          {mode === "officer" ? "เจ้าหน้าที่" : "งานสื่อสารและ รปภ."}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/20 pb-16 lg:pb-0">
      <RealtimeRefresh />

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card lg:flex">
        {brand}
        <div className="flex-1 overflow-y-auto">{navList}</div>
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
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar>
                    <AvatarFallback>{initials(profile.display_name)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden text-right sm:block">
                    <span className="block text-sm font-medium leading-tight">{profile.display_name}</span>
                    <span className="block text-xs text-muted-foreground">{ROLE_LABELS_TH[profile.role]}</span>
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{profile.display_name}</p>
                  <p className="text-xs text-muted-foreground">{ROLE_LABELS_TH[profile.role]}</p>
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

        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-border bg-card lg:hidden">
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
    </div>
  );
}
