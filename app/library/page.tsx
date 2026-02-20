import { ensureDefaultTypes } from "@/app/actions";
import { LibraryView } from "@/components/library-view";
import { getMetaData, getUserOrRedirect, getWorkItems } from "@/lib/queries";

export default async function LibraryPage() {
  const { user } = await getUserOrRedirect();
  await ensureDefaultTypes();
  const [items, meta] = await Promise.all([getWorkItems(user.id), getMetaData(user.id)]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">ライブラリ</h1>
      <LibraryView items={items} types={meta.types} series={meta.series} />
    </div>
  );
}
