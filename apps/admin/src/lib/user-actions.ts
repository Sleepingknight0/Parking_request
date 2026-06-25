"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@nacc/db/server";
import { createServiceClient } from "@nacc/db/service";
import { usernameToEmail } from "@nacc/db";
import { requireProfile } from "@nacc/auth/guards";
import {
  userCreateSchema,
  userUpdateSchema,
  passwordResetSchema,
  type UserCreateInput,
  type UserUpdateInput,
  type Role,
  type ActivityAction,
} from "@nacc/types";

export interface ActionResult {
  ok: boolean;
  error?: string;
  id?: string;
}

const MANAGER_ROLES: Role[] = ["super_admin", "admin"];

async function log(action: ActivityAction, entityId: string, actorId: string, meta?: Record<string, unknown>) {
  const supabase = await createServerSupabase();
  await supabase.from("activity_logs").insert({
    actor_id: actorId,
    action,
    entity_type: "profile",
    entity_id: entityId,
    metadata: meta ?? null,
  });
}

export async function createUser(input: UserCreateInput): Promise<ActionResult> {
  const { profile } = await requireProfile({ roles: MANAGER_ROLES });
  const parsed = userCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const v = parsed.data;

  const svc = createServiceClient();
  const { data, error } = await svc.auth.admin.createUser({
    email: usernameToEmail(v.username),
    password: v.password,
    email_confirm: true,
    user_metadata: {
      username: v.username,
      display_name: v.display_name,
      role: v.role,
      phone: v.phone ?? "",
      department_id: v.department_id ?? "",
    },
  });
  if (error || !data.user) {
    return { ok: false, error: error?.message ?? "สร้างบัญชีไม่สำเร็จ (ชื่อผู้ใช้อาจซ้ำ)" };
  }

  // handle_new_user created the profile; ensure all fields are set.
  await svc
    .from("profiles")
    .update({
      username: v.username,
      display_name: v.display_name,
      role: v.role,
      phone: v.phone ?? null,
      department_id: v.department_id ?? null,
    })
    .eq("id", data.user.id);

  await log("user.create", data.user.id, profile.id, { role: v.role });
  revalidatePath("/users");
  return { ok: true, id: data.user.id };
}

export async function updateUser(userId: string, input: UserUpdateInput): Promise<ActionResult> {
  const { profile } = await requireProfile({ roles: MANAGER_ROLES });
  const parsed = userUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const v = parsed.data;

  const svc = createServiceClient();
  const { error } = await svc
    .from("profiles")
    .update({
      display_name: v.display_name,
      role: v.role,
      phone: v.phone ?? null,
      department_id: v.department_id ?? null,
      is_active: v.is_active,
    })
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };

  await svc.auth.admin.updateUserById(userId, {
    user_metadata: { display_name: v.display_name, role: v.role },
  });

  await log("user.update", userId, profile.id, { role: v.role });
  revalidatePath("/users");
  return { ok: true, id: userId };
}

export async function setUserRole(userId: string, role: Role): Promise<ActionResult> {
  const { profile } = await requireProfile({ roles: MANAGER_ROLES });
  const svc = createServiceClient();
  const { error } = await svc.from("profiles").update({ role }).eq("id", userId);
  if (error) return { ok: false, error: error.message };
  await svc.auth.admin.updateUserById(userId, { user_metadata: { role } });
  await log("user.role_change", userId, profile.id, { role });
  revalidatePath("/users");
  return { ok: true, id: userId };
}

export async function setUserActive(userId: string, active: boolean): Promise<ActionResult> {
  const { profile } = await requireProfile({ roles: MANAGER_ROLES });
  const svc = createServiceClient();
  const { error } = await svc.from("profiles").update({ is_active: active }).eq("id", userId);
  if (error) return { ok: false, error: error.message };
  await log("user.deactivate", userId, profile.id, { active });
  revalidatePath("/users");
  return { ok: true, id: userId };
}

export async function resetPassword(userId: string, password: string): Promise<ActionResult> {
  const { profile } = await requireProfile({ roles: MANAGER_ROLES });
  const parsed = passwordResetSchema.safeParse({ password });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const svc = createServiceClient();
  const { error } = await svc.auth.admin.updateUserById(userId, { password });
  if (error) return { ok: false, error: error.message };
  await log("user.reset_password", userId, profile.id);
  return { ok: true, id: userId };
}
