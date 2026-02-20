import type { ListOrderRow } from "@/lib/queries";
import type { WorkItem } from "@/lib/types";

export function buildOrderMaps(rows: ListOrderRow[]) {
  const globalMap = new Map<string, number>();
  const typeMap = new Map<string, Map<string, number>>();

  rows.forEach((row) => {
    if (row.scope_type === "global") {
      globalMap.set(row.work_item_id, row.position);
      return;
    }
    if (!row.type_id) return;
    if (!typeMap.has(row.type_id)) typeMap.set(row.type_id, new Map<string, number>());
    typeMap.get(row.type_id)!.set(row.work_item_id, row.position);
  });

  return { globalMap, typeMap };
}

export function sortByOrder(items: WorkItem[], map: Map<string, number>) {
  return [...items].sort((a, b) => {
    const ap = map.get(a.id) ?? 999999;
    const bp = map.get(b.id) ?? 999999;
    if (ap !== bp) return ap - bp;
    return a.created_at.localeCompare(b.created_at);
  });
}
