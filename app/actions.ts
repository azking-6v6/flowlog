"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { DEFAULT_CONTENT_TYPES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { getInspirationEntries } from "@/lib/queries";
import type { ScopeType, Status } from "@/lib/types";

const workItemSchema = z.object({
  title: z.string().min(1),
  type_id: z.string().uuid(),
  series_id: z.string().uuid().nullable().optional(),
  status: z.enum(["planned", "in_progress", "on_hold", "completed"]),
  rating: z.number().min(0).max(5).nullable().optional(),
  review_text: z.string().nullable().optional(),
  review_good: z.string().nullable().optional(),
  review_bad: z.string().nullable().optional(),
  review_note: z.string().nullable().optional(),
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
      review_good: parsed.review_good ?? null,
      review_bad: parsed.review_bad ?? null,
      review_note: parsed.review_note ?? null,
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
      review_good: parsed.review_good ?? null,
      review_bad: parsed.review_bad ?? null,
      review_note: parsed.review_note ?? null,
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

const inspirationEntrySchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  url: z.string().trim().url().nullable().optional(),
  memo: z.string().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  is_starred: z.boolean().default(false)
});

const inspirationCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required")
});

const inspirationQuerySchema = z.object({
  scope: z.enum(["inbox", "all", "star", "category"]),
  categoryId: z.string().uuid().nullable().optional(),
  query: z.string().optional(),
  offset: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(100).default(50)
});

async function revalidateInspirationPaths() {
  revalidatePath("/inspiration");
  revalidatePath("/inspiration/new");
  revalidatePath("/inspiration/categories");
}

export async function ensureDefaultInspirationCategories() {
  const { supabase, user } = await getAuthed();
  const { error } = await supabase.rpc("bootstrap_inspiration_categories", { target_user_id: user.id });
  if (error) throw error;
}

export async function fetchInspirationEntries(input: z.infer<typeof inspirationQuerySchema>) {
  const parsed = inspirationQuerySchema.parse(input);
  const { user } = await getAuthed();
  return getInspirationEntries(user.id, {
    scope: parsed.scope,
    categoryId: parsed.categoryId ?? null,
    query: parsed.query,
    offset: parsed.offset,
    limit: parsed.limit
  });
}

export async function createInspirationEntry(input: z.infer<typeof inspirationEntrySchema>) {
  const parsed = inspirationEntrySchema.parse(input);
  const { supabase, user } = await getAuthed();
  const { data, error } = await supabase
    .from("inspiration_entries")
    .insert({
      user_id: user.id,
      title: parsed.title,
      url: parsed.url || null,
      memo: parsed.memo ?? null,
      category_id: parsed.category_id ?? null,
      is_starred: parsed.is_starred
    })
    .select("id")
    .single();

  if (error) throw error;
  await revalidateInspirationPaths();
  return { id: data.id };
}

export async function updateInspirationEntry(id: string, input: z.infer<typeof inspirationEntrySchema>) {
  const parsed = inspirationEntrySchema.parse(input);
  const { supabase, user } = await getAuthed();
  const { error } = await supabase
    .from("inspiration_entries")
    .update({
      title: parsed.title,
      url: parsed.url || null,
      memo: parsed.memo ?? null,
      category_id: parsed.category_id ?? null,
      is_starred: parsed.is_starred
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
  await revalidateInspirationPaths();
  revalidatePath(`/inspiration/${id}`);
}

export async function deleteInspirationEntry(id: string) {
  const { supabase, user } = await getAuthed();
  const { error } = await supabase.from("inspiration_entries").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw error;
  await revalidateInspirationPaths();
}

export async function toggleInspirationStar(id: string, isStarred: boolean) {
  const { supabase, user } = await getAuthed();
  const { error } = await supabase
    .from("inspiration_entries")
    .update({ is_starred: isStarred })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
  await revalidateInspirationPaths();
  revalidatePath(`/inspiration/${id}`);
}

export async function bulkSetInspirationCategory(entryIds: string[], categoryId: string | null) {
  if (entryIds.length === 0) return;
  const { supabase, user } = await getAuthed();
  const { error } = await supabase
    .from("inspiration_entries")
    .update({ category_id: categoryId })
    .in("id", entryIds)
    .eq("user_id", user.id);
  if (error) throw error;
  await revalidateInspirationPaths();
}

export async function bulkSetInspirationStar(entryIds: string[], isStarred: boolean) {
  if (entryIds.length === 0) return;
  const { supabase, user } = await getAuthed();
  const { error } = await supabase
    .from("inspiration_entries")
    .update({ is_starred: isStarred })
    .in("id", entryIds)
    .eq("user_id", user.id);
  if (error) throw error;
  await revalidateInspirationPaths();
}

export async function createInspirationCategory(name: string) {
  const parsed = inspirationCategorySchema.parse({ name });
  const { supabase, user } = await getAuthed();
  const { data: maxSortRow } = await supabase
    .from("inspiration_categories")
    .select("sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSort = (maxSortRow?.sort_order ?? -1) + 1;
  const { error } = await supabase.from("inspiration_categories").insert({
    user_id: user.id,
    name: parsed.name,
    sort_order: nextSort
  });
  if (error) throw error;
  await revalidateInspirationPaths();
}

export async function renameInspirationCategory(id: string, name: string) {
  const parsed = inspirationCategorySchema.parse({ name });
  const { supabase, user } = await getAuthed();
  const { error } = await supabase.from("inspiration_categories").update({ name: parsed.name }).eq("id", id).eq("user_id", user.id);
  if (error) throw error;
  await revalidateInspirationPaths();
}

export async function moveInspirationCategory(id: string, direction: "up" | "down") {
  const { supabase, user } = await getAuthed();
  const { data: categories, error } = await supabase
    .from("inspiration_categories")
    .select("id,sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;

  const index = (categories ?? []).findIndex((c) => c.id === id);
  if (index < 0) return;
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= (categories?.length ?? 0)) return;

  const current = categories![index];
  const target = categories![targetIndex];

  const { error: firstErr } = await supabase
    .from("inspiration_categories")
    .update({ sort_order: target.sort_order })
    .eq("id", current.id)
    .eq("user_id", user.id);
  if (firstErr) throw firstErr;

  const { error: secondErr } = await supabase
    .from("inspiration_categories")
    .update({ sort_order: current.sort_order })
    .eq("id", target.id)
    .eq("user_id", user.id);
  if (secondErr) throw secondErr;

  await revalidateInspirationPaths();
}

export async function deleteInspirationCategory(id: string) {
  const { supabase, user } = await getAuthed();
  const { error: clearErr } = await supabase
    .from("inspiration_entries")
    .update({ category_id: null })
    .eq("category_id", id)
    .eq("user_id", user.id);
  if (clearErr) throw clearErr;

  const { error } = await supabase.from("inspiration_categories").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw error;
  await revalidateInspirationPaths();
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
