"use client";

import * as React from "react";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Loader2 } from "lucide-react";
import { homePathForRole, roleAllowedInApp, type AppKind } from "@nacc/auth/routing";
import { TH, type Role } from "@nacc/types";

// Mirrors @nacc/auth/actions SignInState. Inlined so this client component does
// not transitively pull server-only modules into its type graph.
export interface SignInState {
  ok: boolean;
  error?: string;
  role?: Role;
}
import { cn } from "../lib/cn";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./card";
import { Input } from "./input";
import { Label } from "./label";

type LoginAction = (prev: SignInState, formData: FormData) => Promise<SignInState>;

export interface LoginCardProps {
  action: LoginAction;
  appKind: AppKind;
  appName: string;
  subtitle?: string;
  /** Absolute URL of the OTHER app, shown when a user logs into the wrong app. */
  otherAppUrl?: string;
  /** Shown under the form (e.g. the dev admin/admin notice). */
  footer?: React.ReactNode;
  initialError?: string;
}

export function LoginCard({
  action,
  appKind,
  appName,
  subtitle,
  otherAppUrl,
  footer,
  initialError,
}: LoginCardProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<SignInState, FormData>(action, {
    ok: false,
    error: initialError,
  });

  const wrongApp =
    state.ok && state.role != null && !roleAllowedInApp(state.role, appKind);

  useEffect(() => {
    if (state.ok && state.role && roleAllowedInApp(state.role, appKind)) {
      router.replace(homePathForRole(state.role));
    }
  }, [state, appKind, router]);

  return (
    <Card className="w-full max-w-sm shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <LogIn className="h-6 w-6" />
        </div>
        <CardTitle className="text-xl">{appName}</CardTitle>
        {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username">{TH.auth.username}</Label>
            <Input
              id="username"
              name="username"
              autoComplete="username"
              required
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">{TH.auth.password}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          {state.error ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          ) : null}

          {wrongApp ? (
            <p className="rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-800">
              {TH.auth.noAccess}
              {otherAppUrl ? (
                <>
                  {" "}
                  <a className="font-semibold underline" href={otherAppUrl}>
                    ไปยังระบบที่ถูกต้อง
                  </a>
                </>
              ) : null}
            </p>
          ) : null}

          <Button type="submit" className="w-full" size="lg" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {TH.auth.signingIn}
              </>
            ) : (
              TH.auth.signIn
            )}
          </Button>
        </form>
        {footer ? (
          <div className={cn("mt-4 text-center text-xs text-muted-foreground")}>{footer}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
