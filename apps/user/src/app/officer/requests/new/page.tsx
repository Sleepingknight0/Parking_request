import { EmptyState } from "@nacc/ui";

export default function NewOfficerRequestPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <EmptyState
          title="บันทึกหนังสือขอที่จอดรถ"
          description="ฟอร์มเจ้าหน้าที่จะใช้ schema กลางจาก @nacc/types ใน Loop User Flow"
        />
      </div>
    </main>
  );
}
