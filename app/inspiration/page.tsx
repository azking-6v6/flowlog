import { ensureDefaultInspirationCategories } from "@/app/actions";
import { InspirationListView } from "@/components/inspiration-list-view";
import { getInspirationCategories, getInspirationEntries, getUserOrRedirect } from "@/lib/queries";

export default async function InspirationPage() {
  const { user } = await getUserOrRedirect();
  await ensureDefaultInspirationCategories();
  const [categories, initial] = await Promise.all([
    getInspirationCategories(user.id),
    getInspirationEntries(user.id, { scope: "all", limit: 50, offset: 0 })
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">インスピレーション</h1>
      <InspirationListView categories={categories} initialEntries={initial.items} initialHasMore={initial.hasMore} />
    </div>
  );
}
