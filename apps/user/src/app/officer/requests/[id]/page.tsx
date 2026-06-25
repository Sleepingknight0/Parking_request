import { EmptyState } from "@nacc/ui";

export default function OfficerRequestDetailPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <EmptyState
          title="รายละเอียดคำขอ"
          description="หน้ารายละเอียดจะเชื่อมข้อมูลจริงและไฟล์แนบใน Loop User Flow"
        />
      </div>
    </main>
  );
}
