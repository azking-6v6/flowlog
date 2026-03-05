import Link from "next/link";
import { notFound } from "next/navigation";
import { ensureDefaultInspirationCategories } from "@/app/actions";
import { InspirationEntryForm } from "@/components/inspiration-entry-form";
import { Button } from "@/components/ui/button";
import { getInspirationCategories, getInspirationEntryById, getUserOrRedirect } from "@/lib/queries";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function InspirationDetailPage({ params }: Props) {
  const { id } = await params;
  const { user } = await getUserOrRedirect();
  await ensureDefaultInspirationCategories();
  const [categories, entry] = await Promise.all([getInspirationCategories(user.id), getInspirationEntryById(user.id, id)]);

  if (!entry) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">インスピレーション編集</h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/inspiration">戻る</Link>
        </Button>
      </div>
      <InspirationEntryForm mode="edit" categories={categories} entry={entry} />
    </div>
  );
}
