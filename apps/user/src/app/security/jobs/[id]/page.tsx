import { EmptyState } from "@nacc/ui";

export default function SecurityJobDetailPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <EmptyState
          title="รายละเอียดงาน"
          description="ปุ่มรับงาน เริ่มงาน ส่งงาน และยกเลิกงานจะเพิ่มใน Loop User Flow"
        />
      </div>
    </main>
  );
}
