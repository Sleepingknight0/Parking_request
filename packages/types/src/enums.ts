/**
 * Domain enums — THE CONTRACT. Do not invent new values.
 * Mirrors the CHECK constraints in supabase/migrations and the RLS policies.
 * Any change here MUST be paired with a migration + docs/DATABASE_CONTRACT.md update.
 */

/* ───────────────────────── Roles ───────────────────────── */

export const ROLES = [
  "super_admin",
  "admin",
  "officer",
  "security_staff",
  "viewer",
] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS_TH: Record<Role, string> = {
  super_admin: "ผู้ดูแลสูงสุด",
  admin: "ผู้ดูแลระบบ",
  officer: "เจ้าหน้าที่",
  security_staff: "พนักงานสื่อสารและ รปภ.",
  viewer: "ผู้ดูเท่านั้น",
};

/** Roles that belong in the ADMIN app. */
export const ADMIN_APP_ROLES: Role[] = ["super_admin", "admin", "viewer"];
/** Roles that belong in the USER app. */
export const USER_APP_ROLES: Role[] = ["officer", "security_staff"];

/** Where each role lands after login (path within its own app). */
export const ROLE_HOME: Record<Role, string> = {
  super_admin: "/dashboard",
  admin: "/dashboard",
  viewer: "/dashboard",
  officer: "/officer/dashboard",
  security_staff: "/security/dashboard",
};

export function isAdminRole(role: Role): boolean {
  return ADMIN_APP_ROLES.includes(role);
}
export function isUserRole(role: Role): boolean {
  return USER_APP_ROLES.includes(role);
}

/* ───────────────────────── Statuses ───────────────────────── */

/** Full status enum used by the DB CHECK constraint, UI, and RLS policies. */
export const REQUEST_STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "approved",
  "assigned",
  "in_progress",
  "completed",
  "cancelled",
  "rejected",
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const ACTIVE_STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "approved",
  "assigned",
  "in_progress",
  "completed",
  "cancelled",
  "rejected",
] as const satisfies readonly RequestStatus[];
export type ActiveStatus = (typeof ACTIVE_STATUSES)[number];

export const RESERVED_STATUSES = [] as const satisfies readonly RequestStatus[];

export const STATUS_LABELS_TH: Record<RequestStatus, string> = {
  draft: "แบบร่าง",
  submitted: "บันทึกหนังสือแล้ว",
  under_review: "กำลังตรวจสอบ",
  approved: "อนุมัติแล้ว",
  assigned: "มอบหมายงานแล้ว",
  in_progress: "กำลังดำเนินการ",
  completed: "เสร็จสมบูรณ์",
  cancelled: "ยกเลิก",
  rejected: "ไม่อนุมัติ",
};

/** Tailwind class set for status badges (see @nacc/ui StatusBadge). */
export const STATUS_BADGE_CLASSES: Record<RequestStatus, string> = {
  draft: "bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-500/20",
  submitted: "bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-500/20",
  under_review: "bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-500/20",
  approved: "bg-green-100 text-green-700 ring-1 ring-inset ring-green-500/20",
  assigned: "bg-purple-100 text-purple-700 ring-1 ring-inset ring-purple-500/20",
  in_progress: "bg-orange-100 text-orange-700 ring-1 ring-inset ring-orange-500/20",
  completed: "bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-500/20",
  cancelled: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20",
  rejected: "bg-red-100 text-red-700 ring-1 ring-inset ring-red-500/20",
};

/** Hex colors for the FullCalendar event background per status. */
export const STATUS_HEX: Record<RequestStatus, string> = {
  draft: "#6b7280",
  submitted: "#3b82f6",
  under_review: "#f59e0b",
  approved: "#22c55e",
  assigned: "#a855f7",
  in_progress: "#f97316",
  completed: "#10b981",
  cancelled: "#64748b",
  rejected: "#ef4444",
};

/**
 * Allowed transitions in the active approval workflow.
 * Mirrors the validate_status_transition() trigger in the DB.
 */
export const STATUS_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  draft: ["submitted"],
  submitted: ["under_review", "cancelled"],
  under_review: ["approved", "rejected", "cancelled"],
  approved: ["assigned", "cancelled"],
  assigned: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  rejected: [],
};

export function canTransition(from: RequestStatus, to: RequestStatus): boolean {
  return STATUS_TRANSITIONS[from].includes(to);
}

export function nextStatuses(from: RequestStatus): RequestStatus[] {
  return STATUS_TRANSITIONS[from];
}

/** Statuses a request can hold and still be considered "open work". */
export const OPEN_STATUSES: RequestStatus[] = [
  "submitted",
  "under_review",
  "approved",
  "assigned",
  "in_progress",
];

/* ───────────────────────── Priority ───────────────────────── */

export const PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_LABELS_TH: Record<Priority, string> = {
  low: "ต่ำ",
  normal: "ปกติ",
  high: "สูง",
  urgent: "เร่งด่วน",
};

/* ───────────────────────── Date pattern ───────────────────────── */

export const DATE_PATTERNS = ["single", "multi", "range", "weekly"] as const;
export type DatePattern = (typeof DATE_PATTERNS)[number];

export const DATE_PATTERN_LABELS_TH: Record<DatePattern, string> = {
  single: "วันเดียว",
  multi: "หลายวัน",
  range: "ช่วงวันที่",
  weekly: "รายสัปดาห์",
};

/* ───────────────────────── Attachments / storage ───────────────────────── */

export const STORAGE_PROVIDERS = ["supabase", "google_drive"] as const;
export type StorageProvider = (typeof STORAGE_PROVIDERS)[number];

export const COMPLETION_PHOTO_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export type CompletionPhotoMimeType = (typeof COMPLETION_PHOTO_MIME_TYPES)[number];

export function isCompletionPhotoMimeType(mime: string): mime is CompletionPhotoMimeType {
  return (COMPLETION_PHOTO_MIME_TYPES as readonly string[]).includes(mime);
}

export const FILE_TYPES = [
  "official_letter",
  "general_attachment",
  "completion_photo",
  "cancellation_evidence",
] as const;
export type FileType = (typeof FILE_TYPES)[number];

export const FILE_TYPE_LABELS_TH: Record<FileType, string> = {
  official_letter: "หนังสือราชการ",
  general_attachment: "ไฟล์แนบทั่วไป",
  completion_photo: "รูปถ่ายส่งงาน",
  cancellation_evidence: "หลักฐานการยกเลิก",
};

/** Top-level folder inside the storage bucket per file type. */
export const FILE_TYPE_FOLDER: Record<FileType, string> = {
  official_letter: "official_letters",
  general_attachment: "general",
  completion_photo: "completion_photos",
  cancellation_evidence: "cancellation_evidence",
};

export const STORAGE_BUCKET = "parking-request-files";
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export function isAllowedMimeType(mime: string): mime is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mime);
}

/* ───────────────────────── Activity log actions ───────────────────────── */

export const ACTIVITY_ACTIONS = [
  "request.create",
  "request.update",
  "request.submit",
  "request.assign",
  "request.reassign",
  "request.status_change",
  "request.cancel",
  "request.complete",
  "request.delete",
  "attachment.upload",
  "attachment.delete",
  "user.create",
  "user.update",
  "user.role_change",
  "user.deactivate",
  "user.reset_password",
  "legacy.import",
] as const;
export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];
