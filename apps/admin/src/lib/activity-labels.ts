/**
 * Thai labels for the audit-log (activity_logs) page.
 * Kept local to the admin app to avoid editing the shared @nacc/types labels
 * while Cursor is actively working there.
 */
import { ACTIVITY_ACTIONS, type ActivityAction } from "@nacc/types";

export const ACTIVITY_ACTION_LABELS_TH: Record<ActivityAction, string> = {
  "request.create": "สร้างคำขอ",
  "request.update": "แก้ไขคำขอ",
  "request.submit": "ส่งคำขอ",
  "request.assign": "มอบหมายงาน",
  "request.reassign": "มอบหมายงานใหม่",
  "request.status_change": "เปลี่ยนสถานะ",
  "request.cancel": "ยกเลิกคำขอ",
  "request.complete": "ปิดงาน",
  "request.delete": "ลบคำขอ",
  "attachment.upload": "อัปโหลดไฟล์แนบ",
  "attachment.delete": "ลบไฟล์แนบ",
  "user.create": "สร้างผู้ใช้",
  "user.update": "แก้ไขผู้ใช้",
  "user.role_change": "เปลี่ยนบทบาท",
  "user.deactivate": "ปิดใช้งานผู้ใช้",
  "user.reset_password": "รีเซ็ตรหัสผ่าน",
  "legacy.import": "นำเข้าข้อมูลเก่า",
};

export function activityActionLabel(action: string): string {
  return ACTIVITY_ACTION_LABELS_TH[action as ActivityAction] ?? action;
}

const ENTITY_LABELS_TH: Record<string, string> = {
  parking_requests: "คำขอ",
  profiles: "ผู้ใช้",
  request_attachments: "ไฟล์แนบ",
  departments: "สำนัก/หน่วยงาน",
  locations: "สถานที่",
  parking_zones: "โซนจอดรถ",
};

export function activityEntityLabel(entity?: string | null): string {
  if (!entity) return "-";
  return ENTITY_LABELS_TH[entity] ?? entity;
}

/** Group action codes for the filter dropdown. */
export const ACTIVITY_ACTION_OPTIONS = ACTIVITY_ACTIONS.map((a) => ({
  value: a,
  label: ACTIVITY_ACTION_LABELS_TH[a],
}));
