/**
 * Demo accounts + sample-request templates for `pnpm seed`.
 *
 * NOTE: department/location names are also in supabase/seed.sql (used by local
 * `supabase db reset`). For the HOSTED workflow, scripts/seed.ts is the source
 * of truth — keep the two in sync if you edit the reference lists.
 */
import type { RequestStatus, Priority, Role } from "@nacc/types";

export const DEPARTMENTS: string[] = [
  "สำนักกิจการคณะกรรมการ ป.ป.ช.",
  "สำนักการประชุม",
  "สำนักบริหารงานกลาง",
  "สำนักตรวจสอบภายใน",
  "สำนักตรวจราชการ",
  "สำนักสืบสวนและกิจการพิเศษ",
  "สำนักไต่สวนคดีพิเศษ",
  "กลุ่มที่ปรึกษาสำนักงาน ป.ป.ช.",
  "สำนักพัฒนาวิชาการด้านการศึกษาและกระบวนการมีส่วนร่วมต้านทุจริต",
  "สำนักประเมินคุณธรรม ความโปร่งใส และส่งเสริมธรรมาภิบาล",
  "สำนักมาตรการป้องกันการทุจริต",
  "สำนักป้องกันการขัดกันแห่งผลประโยชน์และกำกับจริยธรรมภาครัฐ",
  "สำนักพัฒนาระบบตรวจสอบทรัพย์สิน",
  "สำนักตรวจสอบทรัพย์สินภาคการเมือง",
  "สำนักตรวจสอบทรัพย์สินภาครัฐและรัฐวิสาหกิจ ๑",
  "สำนักตรวจสอบทรัพย์สินภาครัฐและรัฐวิสาหกิจ ๒",
  "สำนักตรวจสอบทรัพย์สินภาครัฐและรัฐวิสาหกิจ ๓",
  "สำนักตรวจสอบทรัพย์สินภาครัฐและรัฐวิสาหกิจ ๔",
  "สำนักตรวจสอบทรัพย์สินภาครัฐและรัฐวิสาหกิจ ๕",
  "สำนักตรวจสอบทรัพย์สินภาครัฐและรัฐวิสาหกิจ ๖",
  "สำนักไต่สวนการทุจริตคดีการเมืองการปกครอง ๑",
  "สำนักไต่สวนการทุจริตคดีการเมืองการปกครอง ๒",
  "สำนักไต่สวนการทุจริตคดีการเมืองการปกครอง ๓",
  "สำนักไต่สวนการทุจริตคดีเศรษฐกิจ ๑",
  "สำนักไต่สวนการทุจริตคดีเศรษฐกิจ ๒",
  "สำนักไต่สวนการทุจริตคดีเศรษฐกิจ ๓",
  "สำนักไต่สวนการทุจริตคดีของหน่วยงานที่ขึ้นตรงต่อนายกรัฐมนตรี",
  "สำนักไต่สวนการทุจริตคดีความมั่นคงของรัฐ",
  "สำนักไต่สวนการทุจริตคดีความมั่นคงด้านทรัพยากรธรรมชาติและสิ่งแวดล้อม",
  "สำนักกฎหมาย",
  "สำนักพัฒนาระบบกฎหมาย",
  "สำนักพันธกรณีและความร่วมมือระหว่างประเทศ",
  "สำนักคดี ๑",
  "สำนักคดี ๒",
  "สำนักคดี ๓",
  "สำนักยุทธศาสตร์ด้านการป้องกันและปราบปรามการทุจริต",
  "สำนักวิเคราะห์แผนและงบประมาณ",
  "สำนักบริหารงานคลัง",
  "สำนักบริหารทรัพย์สิน",
  "สำนักสื่อสารองค์กร",
  "สำนักบริหารทรัพยากรบุคคล",
  "สถาบันการป้องกันและปราบปรามการทุจริตแห่งชาติ สัญญา ธรรมศักดิ์",
  "สำนักวิจัยและบริการวิชาการด้านการป้องกันและปราบปรามการทุจริต",
  "สำนักเทคโนโลยีสารสนเทศ",
  "สำนักนวัตกรรม เทคโนโลยี และภูมิสารสนเทศ",
];

export const LOCATIONS: string[] = [
  "ข้างอาคาร 1 ฝั่งกองสลาก",
  "ข้างอาคาร 1 ฝั่ง ATM",
  "หน้าอาคาร 3",
  "หน้าอาคาร 2",
  "บริเวณอาคารสถาบันฯ",
  "หน้าอาคาร 4",
  "ชั้นใต้ดินอาคาร 4",
  "อาคาร 4",
  "อาคาร 7",
  "อาคาร 8",
];

export interface DemoUser {
  username: string;
  display_name: string;
  role: Role;
  password: string;
}

/** Demo accounts only — NO real staff names (privacy). admin/admin per brief. */
export const DEMO_USERS: DemoUser[] = [
  { username: "admin", display_name: "ผู้ดูแลระบบ (เดโม)", role: "super_admin", password: "admin" },
  { username: "officer01", display_name: "เจ้าหน้าที่รับหนังสือ 1", role: "officer", password: "password" },
  { username: "officer02", display_name: "เจ้าหน้าที่รับหนังสือ 2", role: "officer", password: "password" },
  { username: "security01", display_name: "เจ้าหน้าที่ รปภ. 1", role: "security_staff", password: "password" },
  { username: "security02", display_name: "เจ้าหน้าที่ รปภ. 2", role: "security_staff", password: "password" },
  { username: "comms01", display_name: "เจ้าหน้าที่สื่อสาร 1", role: "security_staff", password: "password" },
  { username: "viewer01", display_name: "ผู้ดูเท่านั้น (เดโม)", role: "viewer", password: "password" },
];

export interface SampleRequest {
  letterNo: string;
  subject: string;
  deptIndex: number;
  status: RequestStatus;
  locationIndex?: number;
  locationText?: string;
  cars: number;
  /** request date offset in days from today (can be negative for past). */
  dayOffset: number;
  startTime?: string;
  endTime?: string;
  plates: string[];
  createdBy: string; // username
  assignedTo?: string; // username
  priority?: Priority;
  contactName?: string;
  contactPhone?: string;
}

export const SAMPLE_REQUESTS: SampleRequest[] = [
  { letterNo: "ปช 0001/2569", subject: "ขอใช้ที่จอดรถสำหรับการประชุมคณะกรรมการ", deptIndex: 1, status: "submitted", locationIndex: 2, cars: 5, dayOffset: 2, startTime: "08:30", endTime: "16:30", plates: ["1กก 1234", "2ขข 5678"], createdBy: "officer01", priority: "high", contactName: "นางสาวสมหญิง", contactPhone: "0812345678" },
  { letterNo: "ปช 0002/2569", subject: "ขอที่จอดรถผู้บริหารเยี่ยมชม", deptIndex: 38, status: "assigned", locationIndex: 0, cars: 3, dayOffset: 1, startTime: "09:00", endTime: "12:00", plates: ["3คค 9012"], createdBy: "officer01", assignedTo: "security01", contactName: "นายวิชัย", contactPhone: "0898765432" },
  { letterNo: "ปช 0003/2569", subject: "ขอที่จอดรถงานสัมมนาวิชาการ", deptIndex: 43, status: "in_progress", locationIndex: 5, cars: 8, dayOffset: 0, startTime: "07:30", endTime: "17:00", plates: ["4งง 3456", "5จจ 7890", "6ฉฉ 1122"], createdBy: "officer02", assignedTo: "security02", priority: "urgent" },
  { letterNo: "ปช 0004/2569", subject: "ขอที่จอดรถผู้มาติดต่อราชการ", deptIndex: 2, status: "completed", locationIndex: 3, cars: 2, dayOffset: -3, startTime: "08:00", endTime: "15:00", plates: ["7ชช 2233"], createdBy: "officer01", assignedTo: "security01" },
  { letterNo: "ปช 0005/2569", subject: "ขอที่จอดรถกิจกรรมต้านทุจริต", deptIndex: 8, status: "completed", locationIndex: 8, cars: 6, dayOffset: -5, startTime: "08:30", endTime: "16:00", plates: ["8ซซ 4455", "9ฌฌ 6677"], createdBy: "officer02", assignedTo: "comms01" },
  { letterNo: "ปช 0006/2569", subject: "ขอที่จอดรถคณะตรวจราชการ", deptIndex: 4, status: "cancelled", locationIndex: 1, cars: 4, dayOffset: 4, plates: ["1ญญ 8899"], createdBy: "officer01", assignedTo: "security02" },
  { letterNo: "ปช 0007/2569", subject: "ขอที่จอดรถประชุมคณะอนุกรรมการ", deptIndex: 29, status: "submitted", locationIndex: 4, cars: 3, dayOffset: 3, startTime: "13:00", endTime: "16:30", plates: ["2ฎฎ 1010"], createdBy: "officer02", priority: "normal" },
  { letterNo: "ปช 0008/2569", subject: "ขอที่จอดรถผู้ทรงคุณวุฒิ", deptIndex: 41, status: "assigned", locationText: "ลานจอดด้านข้างอาคารกิจกรรม (พื้นที่พิเศษ)", cars: 2, dayOffset: 1, plates: ["3ฏฏ 2020"], createdBy: "officer01", assignedTo: "security01" },
  { letterNo: "ปช 0009/2569", subject: "ขอที่จอดรถงานแถลงข่าว", deptIndex: 39, status: "in_progress", locationIndex: 2, cars: 10, dayOffset: 0, startTime: "06:00", endTime: "12:00", plates: ["4ฐฐ 3030", "5ฑฑ 4040"], createdBy: "officer02", assignedTo: "comms01", priority: "high" },
  { letterNo: "ปช 0010/2569", subject: "ขอที่จอดรถการอบรมเชิงปฏิบัติการ", deptIndex: 44, status: "submitted", locationIndex: 9, cars: 7, dayOffset: 6, startTime: "08:30", endTime: "16:30", plates: ["6ฒฒ 5050"], createdBy: "officer01" },
  { letterNo: "ปช 0011/2569 (ร่าง)", subject: "ขอที่จอดรถ (ยังไม่ส่ง)", deptIndex: 30, status: "draft", locationIndex: 0, cars: 2, dayOffset: 7, plates: ["7ณณ 6060"], createdBy: "officer01" },
  { letterNo: "ปช 0012/2569 (ร่าง)", subject: "ร่างคำขอที่จอดรถสำหรับกิจกรรม", deptIndex: 12, status: "draft", locationText: "ระบุภายหลัง", cars: 1, dayOffset: 10, plates: [], createdBy: "officer02" },
];
