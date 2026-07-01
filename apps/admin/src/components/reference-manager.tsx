"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Loader2 } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  toast,
} from "@nacc/ui";
import { TH } from "@nacc/types";
import { saveDepartment, saveLocation, saveSecurityOfficer } from "@/lib/reference-actions";

export interface ReferenceItem {
  id: string;
  name_th: string;
  secondary: string | null;
  is_active: boolean;
}

export function ReferenceManager({
  kind,
  items,
  secondaryLabel,
}: {
  kind: "department" | "location" | "security_officer";
  items: ReferenceItem[];
  secondaryLabel?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ReferenceItem | null>(null);
  const [name, setName] = React.useState("");
  const [secondary, setSecondary] = React.useState("");
  const [active, setActive] = React.useState(true);
  const [pending, setPending] = React.useState(false);

  function openCreate() {
    setEditing(null);
    setName("");
    setSecondary("");
    setActive(true);
    setOpen(true);
  }
  function openEdit(item: ReferenceItem) {
    setEditing(item);
    setName(item.name_th);
    setSecondary(item.secondary ?? "");
    setActive(item.is_active);
    setOpen(true);
  }

  async function save() {
    setPending(true);
    try {
      let res: { ok: boolean; error?: string };
      if (kind === "department") {
        res = await saveDepartment({
          id: editing?.id,
          name_th: name,
          short_name: secondary || undefined,
          is_active: active,
        });
      } else if (kind === "location") {
        res = await saveLocation({
          id: editing?.id,
          name_th: name,
          description: secondary || undefined,
          is_active: active,
        });
      } else {
        res = await saveSecurityOfficer({
          id: editing?.id,
          name_th: name,
          is_active: active,
        });
      }
      if (!res.ok) {
        toast.error(res.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      toast.success(TH.state.saved);
      setOpen(false);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" /> เพิ่มรายการ
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">ชื่อ</TableHead>
              {secondaryLabel ? (
                <TableHead className="text-right">{secondaryLabel}</TableHead>
              ) : null}
              <TableHead className="text-right">สถานะ</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name_th}</TableCell>
                {secondaryLabel ? (
                  <TableCell className="text-sm text-muted-foreground">{item.secondary ?? "-"}</TableCell>
                ) : null}
                <TableCell>
                  {item.is_active ? <Badge>ใช้งาน</Badge> : <Badge variant="secondary">ปิด</Badge>}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "แก้ไขรายการ" : "เพิ่มรายการ"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>ชื่อ *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            {secondaryLabel ? (
              <div className="space-y-1.5">
                <Label>{secondaryLabel}</Label>
                <Input value={secondary} onChange={(e) => setSecondary(e.target.value)} />
              </div>
            ) : null}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
              เปิดใช้งาน
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{TH.action.close}</Button>
            <Button disabled={pending || !name.trim()} onClick={save}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : TH.action.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
