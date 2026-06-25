/**
 * Domain model aliases over the generated DB rows, with enum columns narrowed
 * to their union types and the common "joined" shapes used by list/detail UIs.
 */
import type { Tables } from "./database.types";
import type {
  Role,
  RequestStatus,
  Priority,
  DatePattern,
  FileType,
} from "./enums";

export type Profile = Omit<Tables<"profiles">, "role"> & { role: Role };
export type Department = Tables<"departments">;
export type Location = Tables<"locations">;
export type ParkingZone = Tables<"parking_zones">;
export type RequestDate = Tables<"request_dates">;
export type LicensePlate = Tables<"request_license_plates">;
export type StatusHistory = Tables<"request_status_history">;
export type ActivityLog = Tables<"activity_logs">;
export type SheetSyncLog = Tables<"sheet_sync_logs">;

export type Attachment = Omit<Tables<"request_attachments">, "file_type"> & {
  file_type: FileType;
};

export type ParkingRequest = Omit<
  Tables<"parking_requests">,
  "status" | "priority" | "date_pattern"
> & {
  status: RequestStatus;
  priority: Priority;
  date_pattern: DatePattern;
};

export type ProfileRef = Pick<Profile, "id" | "display_name" | "username" | "role">;

/** Fully joined request used by the admin/user detail + list pages. */
export type ParkingRequestWithRelations = ParkingRequest & {
  department: Department | null;
  requested_location: Location | null;
  created_by_profile: ProfileRef | null;
  assigned_to_profile: ProfileRef | null;
  request_dates: RequestDate[];
  request_license_plates: LicensePlate[];
  request_attachments: Attachment[];
};

/** Lighter shape for list rows / calendar events. */
export type ParkingRequestListItem = ParkingRequest & {
  department: Pick<Department, "id" | "name_th" | "short_name"> | null;
  requested_location: Pick<Location, "id" | "name_th"> | null;
  assigned_to_profile: ProfileRef | null;
  request_dates: Pick<RequestDate, "request_date" | "start_time" | "end_time">[];
};
