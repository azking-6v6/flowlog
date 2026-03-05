import { redirect } from "next/navigation";
import { ACTIVE_STATUSES } from "@/lib/constants";
import type { ContentType, InspirationCategory, InspirationEntry, Series, WorkItem } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

export async function getUserOrRedirect() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function getMetaData(userId: string) {
  const supabase = await createClient();
  const [{ data: types }, { data: series }] = await Promise.all([
    supabase.from("content_types").select("id,name").eq("user_id", userId).order("name"),
    supabase.from("series").select("id,name,type_id").eq("user_id", userId).order("name")
  ]);
  return {
    types: (types ?? []) as ContentType[],
    series: (series ?? []) as Series[]
  };
}

export async function getWorkItems(userId: string, statuses?: string[]) {
  const supabase = await createClient();
  let query = supabase
    .from("work_items")
    .select("id,user_id,status,rating,review_text,review_good,review_bad,review_note,why_interested,availability_end,completed_at,created_at,updated_at,type_id,series_id,tags,work:works(id,title,thumbnail_url),content_type:content_types(id,name),series:series(id,name,type_id)")
    .eq("user_id", userId);

  if (statuses && statuses.length > 0) query = query.in("status", statuses);

  const { data, error } = await query.order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as WorkItem[];
}

export async function getActiveItems(userId: string) {
  return getWorkItems(userId, [...ACTIVE_STATUSES]);
}

export async function getCompletedItems(userId: string) {
  const items = await getWorkItems(userId, ["completed"]);
  return items.sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""));
}

export type ListOrderRow = {
  work_item_id: string;
  position: number;
  scope_type: "global" | "type";
  type_id: string | null;
};

export async function getOrders(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("list_orders").select("work_item_id,position,scope_type,type_id").eq("user_id", userId);
  if (error) throw error;
  return (data ?? []) as ListOrderRow[];
}

type InspirationScope = "inbox" | "all" | "star" | "category";

export async function getInspirationCategories(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inspiration_categories")
    .select("id,user_id,name,sort_order,created_at")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as InspirationCategory[];
}

export async function getInspirationEntries(
  userId: string,
  options: {
    scope: InspirationScope;
    categoryId?: string | null;
    query?: string;
    limit?: number;
    offset?: number;
  }
) {
  const supabase = await createClient();
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;
  const query = options.query?.trim();

  let builder = supabase
    .from("inspiration_entries")
    .select("id,user_id,title,url,memo,category_id,is_starred,created_at,updated_at,category:inspiration_categories(id,name,sort_order)")
    .eq("user_id", userId);

  if (options.scope === "inbox") {
    builder = builder.is("category_id", null);
  } else if (options.scope === "star") {
    builder = builder.eq("is_starred", true);
  } else if (options.scope === "category" && options.categoryId) {
    builder = builder.eq("category_id", options.categoryId);
  }

  if (query) {
    const escaped = query.replaceAll(",", "\\,");
    builder = builder.or(`title.ilike.%${escaped}%,memo.ilike.%${escaped}%,url.ilike.%${escaped}%`);
  }

  const { data, error } = await builder
    .order("created_at", { ascending: false })
    .range(offset, offset + limit);

  if (error) throw error;

  const rows = ((data ?? []) as unknown as InspirationEntry[]) ?? [];
  return {
    items: rows.slice(0, limit),
    hasMore: rows.length > limit
  };
}

export async function getInspirationEntryById(userId: string, id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inspiration_entries")
    .select("id,user_id,title,url,memo,category_id,is_starred,created_at,updated_at,category:inspiration_categories(id,name,sort_order)")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as InspirationEntry | null;
}
