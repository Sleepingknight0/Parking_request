/**
 * Supabase generated types — public schema.
 *
 * Hand-authored stand-in that matches supabase/migrations exactly so the apps
 * are fully typed before the live DB exists. After linking the hosted project,
 * REGENERATE with `pnpm db:types`.
 *
 * NOTE: Row/Insert types are declared as standalone aliases (not self-referenced
 * through `Database[...]`) so the table `Update` types stay concrete — a circular
 * self-reference makes supabase-js resolve table payloads to `never`.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type ProfilesRow = {
  id: string;
  username: string | null;
  display_name: string;
  role: string;
  phone: string | null;
  department_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
type ProfilesInsert = {
  id: string;
  username?: string | null;
  display_name: string;
  role?: string;
  phone?: string | null;
  department_id?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

type DepartmentsRow = {
  id: string;
  name_th: string;
  short_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
type DepartmentsInsert = {
  id?: string;
  name_th: string;
  short_name?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

type LocationsRow = {
  id: string;
  name_th: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
type LocationsInsert = {
  id?: string;
  name_th: string;
  description?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

type ParkingZonesRow = {
  id: string;
  name_th: string;
  location_id: string | null;
  capacity: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
type ParkingZonesInsert = {
  id?: string;
  name_th: string;
  location_id?: string | null;
  capacity?: number;
  description?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

type ParkingRequestsRow = {
  id: string;
  request_no: string;
  department_id: string | null;
  created_by: string | null;
  official_letter_no: string;
  official_letter_date: string | null;
  received_date: string | null;
  subject: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  requested_location_id: string | null;
  requested_location_text: string | null;
  date_pattern: string;
  cars_count: number;
  purpose: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  assigned_by: string | null;
  assigned_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  cancelled_by: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  completed_by: string | null;
  completed_at: string | null;
  completion_note: string | null;
  admin_note: string | null;
  legacy_source: string | null;
  legacy_row_number: number | null;
  legacy_imported_at: string | null;
  legacy_officer_name: string | null;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
};
type ParkingRequestsInsert = {
  id?: string;
  request_no?: string;
  department_id?: string | null;
  created_by?: string | null;
  official_letter_no: string;
  official_letter_date?: string | null;
  received_date?: string | null;
  subject?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  requested_location_id?: string | null;
  requested_location_text?: string | null;
  date_pattern?: string;
  cars_count?: number;
  purpose?: string | null;
  status?: string;
  priority?: string;
  assigned_to?: string | null;
  assigned_by?: string | null;
  assigned_at?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  rejected_by?: string | null;
  rejected_at?: string | null;
  cancelled_by?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  completed_by?: string | null;
  completed_at?: string | null;
  completion_note?: string | null;
  admin_note?: string | null;
  legacy_source?: string | null;
  legacy_row_number?: number | null;
  legacy_imported_at?: string | null;
  legacy_officer_name?: string | null;
  metadata?: Json | null;
  created_at?: string;
  updated_at?: string;
};

type RequestDatesRow = {
  id: string;
  request_id: string;
  request_date: string;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
};
type RequestDatesInsert = {
  id?: string;
  request_id: string;
  request_date: string;
  start_time?: string | null;
  end_time?: string | null;
  created_at?: string;
};

type LicensePlatesRow = {
  id: string;
  request_id: string;
  plate_no: string;
  vehicle_note: string | null;
  created_at: string;
};
type LicensePlatesInsert = {
  id?: string;
  request_id: string;
  plate_no: string;
  vehicle_note?: string | null;
  created_at?: string;
};

type AttachmentsRow = {
  id: string;
  request_id: string;
  uploaded_by: string | null;
  file_type: string;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  file_size: number | null;
  description: string | null;
  created_at: string;
};
type AttachmentsInsert = {
  id?: string;
  request_id: string;
  uploaded_by?: string | null;
  file_type: string;
  file_name: string;
  file_path: string;
  mime_type?: string | null;
  file_size?: number | null;
  description?: string | null;
  created_at?: string;
};

type StatusHistoryRow = {
  id: string;
  request_id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string | null;
  note: string | null;
  created_at: string;
};
type StatusHistoryInsert = {
  id?: string;
  request_id: string;
  old_status?: string | null;
  new_status: string;
  changed_by?: string | null;
  note?: string | null;
  created_at?: string;
};

type ActivityLogsRow = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Json | null;
  created_at: string;
};
type ActivityLogsInsert = {
  id?: string;
  actor_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  metadata?: Json | null;
  created_at?: string;
};

type SheetSyncLogsRow = {
  id: string;
  entity_type: string;
  entity_id: string | null;
  sync_direction: string;
  status: string;
  message: string | null;
  payload: Json | null;
  created_at: string;
};
type SheetSyncLogsInsert = {
  id?: string;
  entity_type: string;
  entity_id?: string | null;
  sync_direction: string;
  status: string;
  message?: string | null;
  payload?: Json | null;
  created_at?: string;
};

type RequestCountersRow = { counter_date: string; last_seq: number };
type RequestCountersInsert = { counter_date: string; last_seq?: number };

export interface Database {
  public: {
    Tables: {
      profiles: { Row: ProfilesRow; Insert: ProfilesInsert; Update: Partial<ProfilesInsert>; Relationships: [] };
      departments: { Row: DepartmentsRow; Insert: DepartmentsInsert; Update: Partial<DepartmentsInsert>; Relationships: [] };
      locations: { Row: LocationsRow; Insert: LocationsInsert; Update: Partial<LocationsInsert>; Relationships: [] };
      parking_zones: { Row: ParkingZonesRow; Insert: ParkingZonesInsert; Update: Partial<ParkingZonesInsert>; Relationships: [] };
      parking_requests: { Row: ParkingRequestsRow; Insert: ParkingRequestsInsert; Update: Partial<ParkingRequestsInsert>; Relationships: [] };
      request_dates: { Row: RequestDatesRow; Insert: RequestDatesInsert; Update: Partial<RequestDatesInsert>; Relationships: [] };
      request_license_plates: { Row: LicensePlatesRow; Insert: LicensePlatesInsert; Update: Partial<LicensePlatesInsert>; Relationships: [] };
      request_attachments: { Row: AttachmentsRow; Insert: AttachmentsInsert; Update: Partial<AttachmentsInsert>; Relationships: [] };
      request_status_history: { Row: StatusHistoryRow; Insert: StatusHistoryInsert; Update: Partial<StatusHistoryInsert>; Relationships: [] };
      activity_logs: { Row: ActivityLogsRow; Insert: ActivityLogsInsert; Update: Partial<ActivityLogsInsert>; Relationships: [] };
      sheet_sync_logs: { Row: SheetSyncLogsRow; Insert: SheetSyncLogsInsert; Update: Partial<SheetSyncLogsInsert>; Relationships: [] };
      request_counters: { Row: RequestCountersRow; Insert: RequestCountersInsert; Update: Partial<RequestCountersInsert>; Relationships: [] };
    };
    Views: {};
    Functions: {
      next_request_no: { Args: Record<string, never>; Returns: string };
      current_role_name: { Args: Record<string, never>; Returns: string };
    };
    Enums: {};
    CompositeTypes: {};
  };
}

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
