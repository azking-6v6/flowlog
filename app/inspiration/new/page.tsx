import Link from "next/link";
import { ensureDefaultInspirationCategories } from "@/app/actions";
import { InspirationEntryForm } from "@/components/inspiration-entry-form";
import { Button } from "@/components/ui/button";
import { getInspirationCategories, getUserOrRedirect } from "@/lib/queries";

export default async function NewInspirationPage() {
  const { user } = await getUserOrRedirect();
  await ensureDefaultInspirationCategories();
  const categories = await getInspirationCategories(user.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">インスピレーション追加</h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/inspiration">戻る</Link>
        </Button>
      </div>
      <InspirationEntryForm mode="new" categories={categories} />
    </div>
  );
}
