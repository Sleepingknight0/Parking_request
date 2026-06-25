import { notFound } from "next/navigation";
import {
  SIGN_OUTPUT_METHODS,
  isSignOutputMethod,
  type SignOutputMethod,
} from "@nacc/types";
import { createServerSupabase } from "@nacc/db/server";
import { getRequestById } from "@nacc/db/queries";
import { AdminSecuritySignCard } from "@/components/admin-security-sign-card";
import { AdminSecuritySignPrintActions } from "@/components/admin-security-sign-print-actions";
import { buildAdminSecuritySignPayloads } from "@/lib/security-signs";

export const dynamic = "force-dynamic";

export default async function AdminSecuritySignPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const rawMethod = Array.isArray(sp.method) ? sp.method[0] : sp.method;
  const method: SignOutputMethod = isSignOutputMethod(rawMethod) ? rawMethod : "print";
  const auto = (Array.isArray(sp.auto) ? sp.auto[0] : sp.auto) === "1";

  if (rawMethod && !SIGN_OUTPUT_METHODS.includes(rawMethod as SignOutputMethod)) {
    notFound();
  }

  const supabase = await createServerSupabase();
  const request = await getRequestById(supabase, id);
  if (!request) notFound();

  const payloads = buildAdminSecuritySignPayloads(request);

  return (
    <>
      <AdminSecuritySignPrintActions auto={auto} />

      <div className="security-sign-font mx-auto w-full max-w-5xl space-y-8 p-4 print:max-w-none print:space-y-0 print:p-0">
        {payloads.map((payload) => (
          <div key={`${payload.plateNo}-${payload.signIndex}`} className="break-after-page print:p-0">
            <AdminSecuritySignCard
              payload={payload}
              method={method}
              className="mx-auto max-w-none print:h-[190mm] print:w-[277mm] print:max-w-none"
            />
          </div>
        ))}
      </div>
    </>
  );
}
