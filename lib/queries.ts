import { redirect } from "next/navigation";
import { ACTIVE_STATUSES } from "@/lib/constants";
import type { ContentType, Series, WorkItem } from "@/lib/types";
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
    supabase.from("series").select("id,name").eq("user_id", userId).order("name")
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
    .select("id,user_id,status,rating,review_text,why_interested,availability_end,completed_at,created_at,updated_at,type_id,series_id,tags,work:works(id,title,thumbnail_url),content_type:content_types(id,name),series:series(id,name)")
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
