import { EmptyState } from "@nacc/ui";

export default function SecurityJobsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <EmptyState
          title="รายการงาน"
          description="รายการงาน รปภ. จะเชื่อมต่อข้อมูลจริงใน Loop User Flow"
        />
      </div>
    </main>
  );
}
