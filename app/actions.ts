"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { DEFAULT_CONTENT_TYPES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { ScopeType, Status } from "@/lib/types";

const workItemSchema = z.object({
  title: z.string().min(1),
  type_id: z.string().uuid(),
  series_id: z.string().uuid().nullable().optional(),
  status: z.enum(["planned", "in_progress", "on_hold", "completed"]),
  rating: z.number().min(0).max(5).nullable().optional(),
  review_text: z.string().nullable().optional(),
  why_interested: z.string().nullable().optional(),
  availability_end: z.string().nullable().optional(),
  thumbnail_url: z.string().url().nullable().optional(),
  tags: z.array(z.string()).default([])
});

async function getAuthed() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

async function assertSeriesTypeMatch(seriesId: string, typeId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("series").select("type_id").eq("id", seriesId).eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (!data || data.type_id !== typeId) {
    throw new Error("Selected series does not belong to the selected content type");
  }
}

export async function ensureDefaultTypes() {
  const { supabase, user } = await getAuthed();
  const { data } = await supabase.from("content_types").select("name").eq("user_id", user.id);
  const existing = new Set((data ?? []).map((row) => row.name));
  const inserts = DEFAULT_CONTENT_TYPES.filter((name) => !existing.has(name)).map((name) => ({ user_id: user.id, name }));
  if (inserts.length > 0) await supabase.from("content_types").insert(inserts);
}

export async function createType(name: string) {
  const { supabase, user } = await getAuthed();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Type name required");
  await supabase.from("content_types").insert({ user_id: user.id, name: trimmed });
  revalidatePath("/");
  revalidatePath("/add");
  revalidatePath("/library");
}

export async function createSeries(name: string, typeId: string) {
  const { supabase, user } = await getAuthed();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Series name required");
  if (!typeId) throw new Error("Type required for series");
  await supabase.from("series").insert({ user_id: user.id, name: trimmed, type_id: typeId });
  revalidatePath("/");
  revalidatePath("/add");
  revalidatePath("/library");
}

export async function createWorkItem(payload: z.infer<typeof workItemSchema>) {
  const parsed = workItemSchema.parse(payload);
  const { supabase, user } = await getAuthed();
  if (parsed.series_id) {
    await assertSeriesTypeMatch(parsed.series_id, parsed.type_id, user.id);
  }

  const { data: workRow, error: workErr } = await supabase
    .from("works")
    .insert({ title: parsed.title, thumbnail_url: parsed.thumbnail_url ?? null })
    .select("id")
    .single();

  if (workErr) throw workErr;

  const completedAt = parsed.status === "completed" ? new Date().toISOString() : null;
  const { data: itemRow, error: itemErr } = await supabase
    .from("work_items")
    .insert({
      user_id: user.id,
      work_id: workRow.id,
      type_id: parsed.type_id,
      series_id: parsed.series_id ?? null,
      status: parsed.status,
      rating: parsed.rating ?? null,
      review_text: parsed.review_text ?? null,
      why_interested: parsed.why_interested ?? null,
      availability_end: parsed.availability_end ?? null,
      completed_at: completedAt,
      tags: parsed.tags
    })
    .select("id,type_id")
    .single();

  if (itemErr) throw itemErr;

  const [{ data: maxGlobal }, { data: maxType }] = await Promise.all([
    supabase.from("list_orders").select("position").eq("user_id", user.id).eq("scope_type", "global").order("position", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("list_orders").select("position").eq("user_id", user.id).eq("scope_type", "type").eq("type_id", itemRow.type_id).order("position", { ascending: false }).limit(1).maybeSingle()
  ]);

  await supabase.from("list_orders").insert([
    {
      user_id: user.id,
      scope_type: "global",
      work_item_id: itemRow.id,
      position: (maxGlobal?.position ?? 0) + 1
    },
    {
      user_id: user.id,
      scope_type: "type",
      type_id: itemRow.type_id,
      work_item_id: itemRow.id,
      position: (maxType?.position ?? 0) + 1
    }
  ]);

  revalidatePath("/");
  revalidatePath("/library");
  revalidatePath("/manage");
}

const updateSchema = workItemSchema.extend({ id: z.string().uuid() });

export async function updateWorkItem(payload: z.infer<typeof updateSchema>) {
  const parsed = updateSchema.parse(payload);
  const { supabase, user } = await getAuthed();
  const completedAt = parsed.status === "completed" ? new Date().toISOString() : null;
  if (parsed.series_id) {
    await assertSeriesTypeMatch(parsed.series_id, parsed.type_id, user.id);
  }

  const { data: existingItem, error: readErr } = await supabase.from("work_items").select("work_id").eq("id", parsed.id).eq("user_id", user.id).single();
  if (readErr) throw readErr;

  const { error: workErr } = await supabase
    .from("works")
    .update({ title: parsed.title, thumbnail_url: parsed.thumbnail_url ?? null })
    .eq("id", existingItem.work_id);
  if (workErr) throw workErr;

  const { error } = await supabase
    .from("work_items")
    .update({
      type_id: parsed.type_id,
      series_id: parsed.series_id ?? null,
      status: parsed.status,
      rating: parsed.rating ?? null,
      review_text: parsed.review_text ?? null,
      why_interested: parsed.why_interested ?? null,
      availability_end: parsed.availability_end ?? null,
      completed_at: completedAt,
      tags: parsed.tags
    })
    .eq("id", parsed.id)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/library");
  revalidatePath("/manage");
}

export async function updateStatus(id: string, status: Status) {
  const { supabase, user } = await getAuthed();
  const completedAt = status === "completed" ? new Date().toISOString() : null;
  const { error } = await supabase.from("work_items").update({ status, completed_at: completedAt }).eq("id", id).eq("user_id", user.id);
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/library");
  revalidatePath("/manage");
}

export async function reorder(scopeType: ScopeType, typeId: string | null, orderedIds: string[]) {
  const { supabase, user } = await getAuthed();

  let deleteQuery = supabase.from("list_orders").delete().eq("user_id", user.id).eq("scope_type", scopeType);
  if (scopeType === "type") deleteQuery = deleteQuery.eq("type_id", typeId);
  if (scopeType === "global") deleteQuery = deleteQuery.is("type_id", null);
  const { error: deleteErr } = await deleteQuery;

  if (deleteErr) throw deleteErr;

  const rows = orderedIds.map((workItemId, idx) => ({
    user_id: user.id,
    scope_type: scopeType,
    type_id: scopeType === "type" ? typeId : null,
    work_item_id: workItemId,
    position: idx + 1
  }));
  if (rows.length > 0) {
    const { error } = await supabase.from("list_orders").insert(rows);
    if (error) throw error;
  }
  revalidatePath("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
