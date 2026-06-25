"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UserPlus, KeyRound, Loader2, Power } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  toast,
} from "@nacc/ui";
import { ROLES, ROLE_LABELS_TH, TH, type Role } from "@nacc/types";
import { createUser, setUserRole, setUserActive, resetPassword } from "@/lib/user-actions";

export interface UserRow {
  id: string;
  username: string | null;
  display_name: string;
  role: Role;
  phone: string | null;
  is_active: boolean;
  department: { name_th: string } | null;
}

export function UsersManager({
  users,
  departments,
}: {
  users: UserRow[];
  departments: { id: string; name_th: string }[];
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [pwUser, setPwUser] = React.useState<UserRow | null>(null);
  const [pending, setPending] = React.useState(false);

  // create form state
  const [form, setForm] = React.useState({
    username: "",
    display_name: "",
    password: "",
    role: "officer" as Role,
    department_id: "",
    phone: "",
  });
  const [newPassword, setNewPassword] = React.useState("");

  async function handleCreate() {
    setPending(true);
    try {
      const res = await createUser({
        username: form.username,
        display_name: form.display_name,
        password: form.password,
        role: form.role,
        department_id: form.department_id || undefined,
        phone: form.phone || undefined,
      });
      if (!res.ok) {
        toast.error(res.error ?? "สร้างบัญชีไม่สำเร็จ");
        return;
      }
      toast.success("สร้างบัญชีผู้ใช้แล้ว");
      setCreateOpen(false);
      setForm({ username: "", display_name: "", password: "", role: "officer", department_id: "", phone: "" });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function changeRole(u: UserRow, role: Role) {
    const res = await setUserRole(u.id, role);
    if (!res.ok) toast.error(res.error ?? "เปลี่ยนบทบาทไม่สำเร็จ");
    else {
      toast.success("เปลี่ยนบทบาทแล้ว");
      router.refresh();
    }
  }

  async function toggleActive(u: UserRow) {
    const res = await setUserActive(u.id, !u.is_active);
    if (!res.ok) toast.error(res.error ?? "ดำเนินการไม่สำเร็จ");
    else {
      toast.success(u.is_active ? "ระงับบัญชีแล้ว" : "เปิดใช้งานบัญชีแล้ว");
      router.refresh();
    }
  }

  async function handleReset() {
    if (!pwUser) return;
    setPending(true);
    try {
      const res = await resetPassword(pwUser.id, newPassword);
      if (!res.ok) toast.error(res.error ?? "รีเซ็ตรหัสผ่านไม่สำเร็จ");
      else {
        toast.success("รีเซ็ตรหัสผ่านแล้ว");
        setPwUser(null);
        setNewPassword("");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <UserPlus className="h-4 w-4" /> เพิ่มผู้ใช้งาน
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">ชื่อ-นามสกุล</TableHead>
              <TableHead className="text-right">ชื่อผู้ใช้</TableHead>
              <TableHead className="text-right">บทบาท</TableHead>
              <TableHead className="text-right">สำนัก</TableHead>
              <TableHead className="text-right">สถานะ</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.display_name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{u.username}</TableCell>
                <TableCell>
                  <Select value={u.role} onValueChange={(v) => changeRole(u, v as Role)}>
                    <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>{ROLE_LABELS_TH[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="max-w-[160px] truncate text-sm">{u.department?.name_th ?? "-"}</TableCell>
                <TableCell>
                  {u.is_active ? (
                    <Badge>ใช้งาน</Badge>
                  ) : (
                    <Badge variant="destructive">ระงับ</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" className="gap-1" onClick={() => setPwUser(u)}>
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1" onClick={() => toggleActive(u)}>
                      <Power className={`h-4 w-4 ${u.is_active ? "text-destructive" : "text-emerald-600"}`} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เพิ่มผู้ใช้งาน</DialogTitle>
            <DialogDescription>สร้างบัญชีใหม่และกำหนดบทบาท</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="ชื่อผู้ใช้ *"><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
            <Field label="ชื่อ-นามสกุล *"><Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} /></Field>
            <Field label="รหัสผ่าน *"><Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
            <Field label="บทบาท *">
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (<SelectItem key={r} value={r}>{ROLE_LABELS_TH[r]}</SelectItem>))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="สำนัก/หน่วยงาน">
              <Select value={form.department_id} onValueChange={(v) => setForm({ ...form, department_id: v })}>
                <SelectTrigger><SelectValue placeholder="ไม่ระบุ" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {departments.map((d) => (<SelectItem key={d.id} value={d.id}>{d.name_th}</SelectItem>))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="เบอร์โทร"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{TH.action.close}</Button>
            <Button disabled={pending} onClick={handleCreate}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : TH.action.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset password dialog */}
      <Dialog open={!!pwUser} onOpenChange={(o) => !o && setPwUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>รีเซ็ตรหัสผ่าน</DialogTitle>
            <DialogDescription>{pwUser?.display_name}</DialogDescription>
          </DialogHeader>
          <Field label="รหัสผ่านใหม่"><Input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwUser(null)}>{TH.action.close}</Button>
            <Button disabled={pending || newPassword.length < 4} onClick={handleReset}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : TH.action.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
