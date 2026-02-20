import { ManageView } from "@/components/manage-view";
import { getCompletedItems, getUserOrRedirect } from "@/lib/queries";

export default async function ManagePage() {
  const { user } = await getUserOrRedirect();
  const items = await getCompletedItems(user.id);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">完了管理</h1>
      <ManageView items={items} />
    </div>
  );
}
