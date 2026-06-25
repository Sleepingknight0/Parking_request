/** UI-only modes for the user app (no DB role). */
export const USER_APP_MODES = ["officer", "comms", "security"] as const;
export type UserAppMode = (typeof USER_APP_MODES)[number];

export const USER_MODE_COOKIE = "nacc_user_mode";

export const USER_MODE_HOME: Record<UserAppMode, string> = {
  officer: "/officer/dashboard",
  comms: "/comms/dashboard",
  security: "/security/dashboard",
};

/** Demo accounts used for silent sign-in per mode. */
export const USER_MODE_DEMO_ACCOUNT: Record<UserAppMode, string> = {
  officer: "officer01",
  comms: "comms01",
  security: "security01",
};

export const USER_MODE_LABELS_TH: Record<UserAppMode, string> = {
  officer: "เจ้าหน้าที่",
  comms: "พนักงานสื่อสาร",
  security: "เจ้าหน้าที่ รปภ.",
};

export function isUserAppMode(value: string): value is UserAppMode {
  return (USER_APP_MODES as readonly string[]).includes(value);
}
