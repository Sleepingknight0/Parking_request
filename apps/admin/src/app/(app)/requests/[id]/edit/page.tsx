import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Button } from "@nacc/ui";
import { TH, type DatePattern } from "@nacc/types";
import { createServerSupabase } from "@nacc/db/server";
import { getRequestById } from "@nacc/db/queries";
import { requireProfile } from "@nacc/auth/guards";
import { RequestForm } from "@/components/request-form";

export const dynamic = "force-dynamic";

export default async function EditRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireProfile({ roles: ["super_admin", "admin"] });
  const { id } = await params;
  const supabase = await createServerSupabase();
  const [request, { data: departments }, { data: locations }] = await Promise.all([
    getRequestById(supabase, id),
    supabase.from("departments").select("id,name_th").eq("is_active", true).order("name_th"),
    supabase.from("locations").select("id,name_th").eq("is_active", true).order("name_th"),
  ]);
  if (!request) notFound();

  return (
    <>
      <PageHeader
        title={`${TH.action.edit} - ${request.request_no}`}
        actions={
          <Button asChild variant="outline">
            <Link href={`/requests/${id}`}>{TH.action.back}</Link>
          </Button>
        }
      />
      <RequestForm
        mode="edit"
        requestId={id}
        departments={(departments ?? []) as { id: string; name_th: string }[]}
        locations={(locations ?? []) as { id: string; name_th: string }[]}
        initial={{
          department_id: request.department_id ?? "",
          official_letter_no: request.official_letter_no,
          official_letter_date: request.official_letter_date ?? "",
          received_date: request.received_date ?? "",
          subject: request.subject ?? "",
          contact_name: request.contact_name ?? "",
          contact_phone: request.contact_phone ?? "",
          requested_location_id: request.requested_location_id ?? "",
          requested_location_text: request.requested_location_text ?? "",
          cars_count: request.cars_count,
          purpose: request.purpose ?? "",
          admin_note: request.admin_note ?? "",
          priority: request.priority,
          date_pattern: request.date_pattern as DatePattern,
          dates: request.request_dates.map((d) => ({
            request_date: d.request_date,
            start_time: d.start_time,
            end_time: d.end_time,
          })),
          plates: request.request_license_plates.map((p) => ({
            plate_no: p.plate_no,
            vehicle_note: p.vehicle_note,
          })),
        }}
      />
    </>
  );
}
