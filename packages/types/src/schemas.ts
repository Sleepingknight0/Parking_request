/**
 * Zod schemas — shared form/input validation for BOTH apps and server actions.
 * Error messages are Thai (user-facing).
 */
import { z } from "zod";
import { ROLES, PRIORITIES, DATE_PATTERNS, type Role } from "./enums";

const roleEnum = z.enum(ROLES as unknown as [Role, ...Role[]]);
const priorityEnum = z.enum(PRIORITIES as unknown as [string, ...string[]]);
const datePatternEnum = z.enum(DATE_PATTERNS as unknown as [string, ...string[]]);

/** Optional date string (ISO yyyy-mm-dd) that treats "" as undefined. */
const optionalDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ไม่ถูกต้อง")
  .optional()
  .or(z.literal("").transform(() => undefined));

const optionalTime = z
  .string()
  .trim()
  .regex(/^\d{2}:\d{2}$/, "รูปแบบเวลาไม่ถูกต้อง (HH:MM)")
  .optional()
  .or(z.literal("").transform(() => undefined));

/* ───────────────────────── Auth ───────────────────────── */

export const loginSchema = z.object({
  username: z.string().trim().min(1, "กรุณากรอกชื่อผู้ใช้"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});
export type LoginInput = z.infer<typeof loginSchema>;

/* ───────────────────────── Request form ───────────────────────── */

export const requestDateSchema = z.object({
  request_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ไม่ถูกต้อง"),
  start_time: optionalTime,
  end_time: optionalTime,
});
export type RequestDateInput = z.infer<typeof requestDateSchema>;

export const licensePlateSchema = z.object({
  plate_no: z.string().trim().min(1, "กรุณากรอกป้ายทะเบียน"),
  vehicle_note: z.string().trim().optional(),
});
export type LicensePlateInput = z.infer<typeof licensePlateSchema>;

/**
 * Base request form. Used for BOTH "save draft" (loose) and "submit" (strict).
 * Submit-time requirements (≥1 date, a location, etc.) are enforced via
 * requestSubmitRefine in server actions so drafts can stay incomplete.
 */
export const requestFormSchema = z.object({
  department_id: z.string().uuid("กรุณาเลือกสำนัก/หน่วยงาน").optional().or(z.literal("").transform(() => undefined)),
  official_letter_no: z.string().trim().min(1, "กรุณากรอกเลขหนังสือ"),
  official_letter_date: optionalDate,
  received_date: optionalDate,
  subject: z.string().trim().optional(),
  contact_name: z.string().trim().optional(),
  contact_phone: z.string().trim().optional(),
  receiving_officer_id: z
    .string()
    .uuid("กรุณาเลือกเจ้าหน้าที่ที่รับเรื่อง")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  requested_location_id: z.string().uuid().optional().or(z.literal("").transform(() => undefined)),
  requested_location_text: z.string().trim().optional(),
  date_pattern: datePatternEnum.default("single"),
  cars_count: z.coerce.number().int().min(1, "จำนวนรถต้องอย่างน้อย 1 คัน").default(1),
  purpose: z.string().trim().optional(),
  priority: priorityEnum.default("normal"),
  admin_note: z.string().trim().optional(),
  dates: z.array(requestDateSchema).default([]),
  plates: z.array(licensePlateSchema).default([]),
});
export type RequestFormInput = z.input<typeof requestFormSchema>;
export type RequestFormValues = z.infer<typeof requestFormSchema>;

/** Extra checks required to SUBMIT (not for drafts). */
export function validateForSubmit(values: RequestFormValues): string[] {
  const errors: string[] = [];
  if (!values.department_id) errors.push("กรุณาเลือกสำนัก/หน่วยงานผู้ขอ");
  if (values.dates.length < 1) errors.push("กรุณาเลือกวันที่ต้องการใช้ที่จอดรถอย่างน้อย 1 วัน");
  if (!values.requested_location_id && !values.requested_location_text) {
    errors.push("กรุณาเลือกหรือระบุสถานที่ที่ต้องการจอด");
  }
  return errors;
}

/* ───────────────────────── Status actions ───────────────────────── */

export const assignSchema = z.object({
  assigned_to: z.string().uuid("กรุณาเลือกผู้รับผิดชอบ"),
  note: z.string().trim().optional(),
});
export type AssignInput = z.infer<typeof assignSchema>;

export const cancelSchema = z.object({
  cancellation_reason: z.string().trim().min(1, "กรุณาระบุเหตุผลการยกเลิก"),
});
export type CancelInput = z.infer<typeof cancelSchema>;

export const completeSchema = z.object({
  completion_note: z.string().trim().optional(),
  // photo count is enforced in the server action (≥1 completion_photo attachment)
});
export type CompleteInput = z.infer<typeof completeSchema>;

export const statusChangeSchema = z.object({
  to_status: z.string().min(1),
  note: z.string().trim().optional(),
});
export type StatusChangeInput = z.infer<typeof statusChangeSchema>;

/* ───────────────────────── Admin: users ───────────────────────── */

export const userCreateSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร")
    .regex(/^[a-zA-Z0-9._-]+$/, "ชื่อผู้ใช้ใช้ได้เฉพาะ a-z, 0-9, จุด, ขีด"),
  display_name: z.string().trim().min(1, "กรุณากรอกชื่อ-นามสกุล"),
  role: roleEnum,
  password: z.string().min(4, "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร"),
  department_id: z.string().uuid().optional().or(z.literal("").transform(() => undefined)),
  phone: z.string().trim().optional(),
});
export type UserCreateInput = z.infer<typeof userCreateSchema>;

export const userUpdateSchema = z.object({
  display_name: z.string().trim().min(1, "กรุณากรอกชื่อ-นามสกุล"),
  role: roleEnum,
  department_id: z.string().uuid().optional().or(z.literal("").transform(() => undefined)),
  phone: z.string().trim().optional(),
  is_active: z.boolean().default(true),
});
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

export const passwordResetSchema = z.object({
  password: z.string().min(4, "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร"),
});
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;

/* ───────────────────────── Admin: reference data ───────────────────────── */

export const departmentSchema = z.object({
  name_th: z.string().trim().min(1, "กรุณากรอกชื่อสำนัก/หน่วยงาน"),
  short_name: z.string().trim().optional(),
  is_active: z.boolean().default(true),
});
export type DepartmentInput = z.infer<typeof departmentSchema>;

export const locationSchema = z.object({
  name_th: z.string().trim().min(1, "กรุณากรอกชื่อสถานที่"),
  description: z.string().trim().optional(),
  is_active: z.boolean().default(true),
});
export type LocationInput = z.infer<typeof locationSchema>;

export const securityOfficerSchema = z.object({
  name_th: z.string().trim().min(1, "กรุณากรอกชื่อเจ้าหน้าที่"),
  is_active: z.boolean().default(true),
  sort_order: z.coerce.number().int().min(0).default(0),
});
export type SecurityOfficerInput = z.infer<typeof securityOfficerSchema>;
