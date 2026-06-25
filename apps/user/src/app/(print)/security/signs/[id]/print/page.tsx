import { notFound } from "next/navigation";
import {
  SIGN_OUTPUT_METHODS,
  isSignOutputMethod,
  type SignOutputMethod,
} from "@nacc/types";
import { getUserAppDb } from "@/lib/user-db";
import { getRequestById } from "@nacc/db/queries";
import { buildSecuritySignPayloads } from "@/lib/security-sign-data";
import { todayIsoLocal } from "@/lib/date-iso";
import { SecuritySignPrintActions } from "@/components/security-sign-print-actions";
import { SecuritySignPrintCard } from "@/components/security-sign-print-card";
import "@/styles/security-sign-font.css";

export const dynamic = "force-dynamic";

export default async function SecuritySignPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const methodRaw = Array.isArray(sp.method) ? sp.method[0] : sp.method;
  const method: SignOutputMethod = isSignOutputMethod(methodRaw) ? methodRaw : "print";
  const auto = (Array.isArray(sp.auto) ? sp.auto[0] : sp.auto) === "1";

  if (methodRaw && !SIGN_OUTPUT_METHODS.includes(methodRaw as SignOutputMethod)) {
    notFound();
  }

  const supabase = getUserAppDb();
  const request = await getRequestById(supabase, id);
  if (!request) notFound();

  const payloads = buildSecuritySignPayloads(request, todayIsoLocal());

  return (
    <>
      <SecuritySignPrintActions auto={auto} />

      <div className="security-sign-print-root security-sign-font mx-auto w-full max-w-5xl space-y-8 p-4 print:max-w-none print:space-y-0 print:p-0">
        {payloads.map((payload) => (
          <div key={`${payload.plateNo}-${payload.signIndex}`} className="sign-print-page">
            <SecuritySignPrintCard
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
