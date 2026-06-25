import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@nacc/ui";
import { TH } from "@nacc/types";
import { createServerSupabase } from "@nacc/db/server";
import { getRequestById } from "@nacc/db/queries";
import { OfficerRequestForm } from "@/components/officer-request-form";

export const dynamic = "force-dynamic";

export default async function EditOfficerRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const [request, refs] = await Promise.all([
    getRequestById(supabase, id),
    Promise.all([
      supabase.from("departments").select("id,name_th").eq("is_active", true).order("name_th"),
      supabase.from("locations").select("id,name_th").eq("is_active", true).order("name_th"),
    ]),
  ]);
  if (!request) notFound();
  if (!["draft", "submitted"].includes(request.status) || request.assigned_to) {
    redirect(`/officer/requests/${id}`);
  }

  const [{ data: departments }, { data: locations }] = refs;

  return (
    <>
      <PageHeader
        title={`${TH.action.edit}: ${request.official_letter_no}`}
        description="แก้ไขได้เฉพาะแบบร่างหรือคำขอที่ยังไม่ถูกมอบหมายงาน"
      />
      <OfficerRequestForm
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
          date_pattern: request.date_pattern,
          dates: request.request_dates,
          plates: request.request_license_plates,
        }}
      />
    </>
  );
}
