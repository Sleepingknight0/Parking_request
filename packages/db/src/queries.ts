/**
 * Shared query selects + helpers usable from any client (browser/server/service).
 * Kept free of next/react imports so it is safe to import anywhere.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@nacc/types/database";
import type {
  Profile,
  ParkingRequestWithRelations,
  ParkingRequestListItem,
} from "@nacc/types";

// Loose generics: @supabase/ssr and supabase-js infer slightly different
// SchemaName generics for the server vs browser clients; `any` lets any of them
// be passed. Query results are explicitly cast to the typed @nacc/types models.
export type AnyClient = SupabaseClient<any, any, any>;

/** Disambiguated FK embeds use the `!<column>` hint (PostgREST). */
export const REQUEST_LIST_SELECT = `
  *,
  department:departments(id,name_th,short_name),
  requested_location:locations(id,name_th),
  assigned_to_profile:profiles!assigned_to(id,display_name,username,role),
  request_dates(request_date,start_time,end_time)
`;

export const REQUEST_DETAIL_SELECT = `
  *,
  department:departments(*),
  requested_location:locations(*),
  created_by_profile:profiles!created_by(id,display_name,username,role),
  assigned_to_profile:profiles!assigned_to(id,display_name,username,role),
  request_dates(*),
  request_license_plates(*),
  request_attachments(*)
`;

export async function getMyProfile(
  supabase: AnyClient,
  userId: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as Profile | null) ?? null;
}

export async function getRequestById(
  supabase: AnyClient,
  id: string,
): Promise<ParkingRequestWithRelations | null> {
  const { data, error } = await supabase
    .from("parking_requests")
    .select(REQUEST_DETAIL_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as ParkingRequestWithRelations | null) ?? null;
}

export interface RequestListFilters {
  status?: string;
  departmentId?: string;
  locationId?: string;
  assignedTo?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export async function listRequests(
  supabase: AnyClient,
  filters: RequestListFilters = {},
): Promise<{ rows: ParkingRequestListItem[]; count: number }> {
  let query = supabase
    .from("parking_requests")
    .select(REQUEST_LIST_SELECT, { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.departmentId) query = query.eq("department_id", filters.departmentId);
  if (filters.locationId) query = query.eq("requested_location_id", filters.locationId);
  if (filters.assignedTo) query = query.eq("assigned_to", filters.assignedTo);
  if (filters.search) {
    const s = `%${filters.search}%`;
    query = query.or(
      `official_letter_no.ilike.${s},request_no.ilike.${s},subject.ilike.${s},contact_name.ilike.${s}`,
    );
  }

  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return {
    rows: (data as unknown as ParkingRequestListItem[]) ?? [],
    count: count ?? 0,
  };
}

export interface DashboardCounts {
  total: number;
  byStatus: Record<string, number>;
  unassigned: number;
  carsToday: number;
  lettersToday: number;
}
