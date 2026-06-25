import { requireAppMode } from "@/lib/user-guards";

/**
 * Minimal layout for printable security sign routes.
 * Auth-guarded for security staff only; no app chrome for clean printing.
 */
export default async function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAppMode("security");
  return <div className="min-h-screen bg-muted/40 print:bg-white">{children}</div>;
}
