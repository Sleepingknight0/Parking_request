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

/** Short Thai hints for status legend on dashboard pages. */
export const STATUS_HINTS_TH: Record<RequestStatus, string> = {
  draft: "ยังบันทึกไม่เสร็จ ยังไม่ได้ส่งคำขอ",
  submitted: "ส่งคำขอแล้ว รอผู้ดูแลตรวจสอบ",
  under_review: "ผู้ดูแลกำลังพิจารณาอนุมัติ",
  approved: "อนุมัติแล้ว รอ รปภ. รับงาน",
  assigned: "รปภ. รับงานแล้ว",
  in_progress: "กำลังจัดที่จอด / ดำเนินการ",
  completed: "ดำเนินการเสร็จสมบูรณ์",
  cancelled: "ยกเลิกคำขอแล้ว",
  rejected: "ไม่ได้รับการอนุมัติ",
};

/** Hex colors for calendar/charts and color swatches (see @nacc/ui StatusBadge). */
export const STATUS_HEX: Record<RequestStatus, string> = {
  draft: "#64748b",
  submitted: "#0284c7",
  under_review: "#ca8a04",
  approved: "#65a30d",
  assigned: "#7c3aed",
  in_progress: "#ea580c",
  completed: "#0891b2",
  cancelled: "#71717a",
  rejected: "#e11d48",
};

/** Status subsets for role-specific dashboard legends. */
export const ADMIN_STATUS_LEGEND: RequestStatus[] = [...REQUEST_STATUSES];

export const OFFICER_STATUS_LEGEND: RequestStatus[] = [
  "draft",
  "submitted",
  "under_review",
  "approved",
  "assigned",
  "in_progress",
  "completed",
  "cancelled",
  "rejected",
];

export const COMMS_STATUS_LEGEND: RequestStatus[] = REQUEST_STATUSES.filter(
  (s) => s !== "draft",
);

export const SECURITY_WORKFLOW_STATUSES = [
  "approved",
  "assigned",
  "in_progress",
  "completed",
  "cancelled",
] as const satisfies readonly RequestStatus[];

export const SECURITY_STATUS_LEGEND: SecurityWorkflowStatus[] = [
  ...SECURITY_WORKFLOW_STATUSES,
];

/** รปภ. workflow statuses — same DB values, security-facing Thai labels. */
export type SecurityWorkflowStatus = (typeof SECURITY_WORKFLOW_STATUSES)[number];

export const SECURITY_STATUS_LABELS_TH: Record<SecurityWorkflowStatus, string> = {
  approved: "รอรับทราบ",
  assigned: "รับทราบแล้ว",
  in_progress: "กำลังจัดที่จอด",
  completed: "ทำงานเรียบร้อยแล้ว",
  cancelled: "ยกเลิก",
};

export const SECURITY_STATUS_HINTS_TH: Record<SecurityWorkflowStatus, string> = {
  approved: "งานอนุมัติแล้ว รอ รปภ. กดรับทราบ",
  assigned: "รับทราบแล้ว รอเริ่มจัดที่จอด",
  in_progress: "กำลังจัดกรวย / ถ่ายรูปส่งงาน",
  completed: "จัดที่จอดและส่งงานเรียบร้อยแล้ว",
  cancelled: "งานถูกยกเลิก",
};

export const SECURITY_STATUS_HEX: Record<SecurityWorkflowStatus, string> = {
  approved: "#ca8a04",
  assigned: "#7c3aed",
  in_progress: "#ea580c",
  completed: "#16a34a",
  cancelled: "#71717a",
};

export function isSecurityWorkflowStatus(status: RequestStatus): status is SecurityWorkflowStatus {
  return (SECURITY_WORKFLOW_STATUSES as readonly RequestStatus[]).includes(status);
}

/** Prep urgency tags shown on security cards (separate from workflow status). */
export const SECURITY_PREP_URGENCY_LEGEND = [
  { level: "normal", label: "ปกติ", hint: "ยังไม่ใกล้วันจอด", hex: "#0d9488" },
  { level: "soon", label: "ด่วน", hint: "ใกล้ถึงวันจอด 2–3 วัน", hex: "#ea580c" },
  { level: "critical", label: "ด่วนมากๆ", hint: "วันนี้/พรุ่งนี้ ต้องจัดล่วงหน้า", hex: "#dc2626" },
  {
    level: "overdue",
    label: "ยังไม่ได้จัดที่จอดรถ",
    hint: "ถึงวันแล้วแต่ยังไม่เริ่มจัด",
    hex: "#b91c1c",
  },
] as const;

export type SecurityPrepUrgencyLevel = (typeof SECURITY_PREP_URGENCY_LEGEND)[number]["level"];

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
