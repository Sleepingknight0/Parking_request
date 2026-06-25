import { EmptyState } from "@nacc/ui";

export default function SecurityHistoryPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <EmptyState
          title="ประวัติการทำงาน"
          description="ประวัติการทำงานของพนักงานสื่อสารและ รปภ. จะเพิ่มใน Loop User Flow"
        />
      </div>
    </main>
  );
}
