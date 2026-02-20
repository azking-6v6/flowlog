import { ensureDefaultTypes } from "@/app/actions";
import { AddWorkForm } from "@/components/add-work-form";
import { getMetaData, getUserOrRedirect } from "@/lib/queries";

export default async function AddPage() {
  const { user } = await getUserOrRedirect();
  await ensureDefaultTypes();
  const meta = await getMetaData(user.id);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">作品を追加</h1>
      <AddWorkForm types={meta.types} series={meta.series} />
    </div>
  );
}
