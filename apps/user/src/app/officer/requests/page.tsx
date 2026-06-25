import { EmptyState } from "@nacc/ui";

export default function OfficerRequestsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <EmptyState
          title="คำขอของฉัน"
          description="รายการคำขอของเจ้าหน้าที่จะเชื่อมต่อข้อมูลจริงใน Loop User Flow"
        />
      </div>
    </main>
  );
}
