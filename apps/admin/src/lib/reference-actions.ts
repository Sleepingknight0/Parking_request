"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@nacc/db/server";
import { requireProfile } from "@nacc/auth/guards";
import { departmentSchema, locationSchema } from "@nacc/types";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const ADMIN = ["super_admin", "admin"] as const;

export async function saveDepartment(
  input: { id?: string; name_th: string; short_name?: string; is_active?: boolean },
): Promise<ActionResult> {
  await requireProfile({ roles: [...ADMIN] });
  const parsed = departmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const supabase = await createServerSupabase();
  const payload = {
    name_th: parsed.data.name_th,
    short_name: parsed.data.short_name ?? null,
    is_active: parsed.data.is_active,
  };
  const { error } = input.id
    ? await supabase.from("departments").update(payload).eq("id", input.id)
    : await supabase.from("departments").insert(payload);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/departments");
  return { ok: true };
}

export async function saveLocation(
  input: { id?: string; name_th: string; description?: string; is_active?: boolean },
): Promise<ActionResult> {
  await requireProfile({ roles: [...ADMIN] });
  const parsed = locationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const supabase = await createServerSupabase();
  const payload = {
    name_th: parsed.data.name_th,
    description: parsed.data.description ?? null,
    is_active: parsed.data.is_active,
  };
  const { error } = input.id
    ? await supabase.from("locations").update(payload).eq("id", input.id)
    : await supabase.from("locations").insert(payload);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/locations");
  return { ok: true };
}
