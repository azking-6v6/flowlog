import { ensureDefaultTypes } from "@/app/actions";
import { PriorityBoard } from "@/components/priority-board";
import { buildOrderMaps } from "@/lib/order";
import { getActiveItems, getMetaData, getOrders, getUserOrRedirect } from "@/lib/queries";

export default async function HomePage() {
  const { user } = await getUserOrRedirect();
  await ensureDefaultTypes();
  const [items, meta, orders] = await Promise.all([getActiveItems(user.id), getMetaData(user.id), getOrders(user.id)]);
  const { globalMap, typeMap } = buildOrderMaps(orders);

  const globalOrder = [...items]
    .sort((a, b) => (globalMap.get(a.id) ?? 999999) - (globalMap.get(b.id) ?? 999999))
    .map((item) => item.id);

  const typeOrderMap = Object.fromEntries(
    Array.from(typeMap.entries()).map(([typeId, map]) => [
      typeId,
      items
        .filter((item) => item.type_id === typeId)
        .sort((a, b) => (map.get(a.id) ?? 999999) - (map.get(b.id) ?? 999999))
        .map((item) => item.id)
    ])
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">優先リスト</h1>
        <p className="text-sm text-muted-foreground">ドラッグ&ドロップで順序を更新できます。</p>
      </div>
      <PriorityBoard items={items} types={meta.types} series={meta.series} globalOrder={globalOrder} typeOrderMap={typeOrderMap} />
    </div>
  );
}
