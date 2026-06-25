import {
  ROLE_HOME,
  ADMIN_APP_ROLES,
  USER_APP_ROLES,
  type Role,
} from "@nacc/types";

/** Path a role lands on after login, within its own app. */
export function homePathForRole(role: Role): string {
  return ROLE_HOME[role];
}

export function roleAllowedInAdminApp(role: Role): boolean {
  return ADMIN_APP_ROLES.includes(role);
}

export function roleAllowedInUserApp(role: Role): boolean {
  return USER_APP_ROLES.includes(role);
}

export type AppKind = "admin" | "user";

export function roleAllowedInApp(role: Role, app: AppKind): boolean {
  return app === "admin"
    ? roleAllowedInAdminApp(role)
    : roleAllowedInUserApp(role);
}
