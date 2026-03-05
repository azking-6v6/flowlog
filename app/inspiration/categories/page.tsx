import Link from "next/link";
import { ensureDefaultInspirationCategories } from "@/app/actions";
import { InspirationCategoriesManager } from "@/components/inspiration-categories-manager";
import { Button } from "@/components/ui/button";
import { getInspirationCategories, getUserOrRedirect } from "@/lib/queries";

export default async function InspirationCategoriesPage() {
  const { user } = await getUserOrRedirect();
  await ensureDefaultInspirationCategories();
  const categories = await getInspirationCategories(user.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">カテゴリ管理</h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/inspiration">戻る</Link>
        </Button>
      </div>
      <InspirationCategoriesManager categories={categories} />
    </div>
  );
}
