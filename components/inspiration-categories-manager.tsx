"use client";

import { useState, useTransition } from "react";
import {
  createInspirationCategory,
  deleteInspirationCategory,
  moveInspirationCategory,
  renameInspirationCategory
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { InspirationCategory } from "@/lib/types";

type Props = {
  categories: InspirationCategory[];
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "処理に失敗しました。";
}

export function InspirationCategoriesManager({ categories }: Props) {
  const [pending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>(
    Object.fromEntries(categories.map((category) => [category.id, category.name]))
  );

  const onCreate = () => {
    if (!newName.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        await createInspirationCategory(newName);
        setNewName("");
      } catch (e) {
        setError(getErrorMessage(e));
      }
    });
  };

  const onRename = (id: string) => {
    const name = drafts[id]?.trim();
    if (!name) return;
    setError(null);
    startTransition(async () => {
      try {
        await renameInspirationCategory(id, name);
      } catch (e) {
        setError(getErrorMessage(e));
      }
    });
  };

  const onMove = (id: string, direction: "up" | "down") => {
    setError(null);
    startTransition(async () => {
      try {
        await moveInspirationCategory(id, direction);
      } catch (e) {
        setError(getErrorMessage(e));
      }
    });
  };

  const onDelete = (id: string, name: string) => {
    const ok = window.confirm(`カテゴリ「${name}」を削除しますか？紐づく項目は未分類に戻ります。`);
    if (!ok) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteInspirationCategory(id);
      } catch (e) {
        setError(getErrorMessage(e));
      }
    });
  };

  return (
    <div className="space-y-4">
      {error ? <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p> : null}
      <Card>
        <CardContent className="flex gap-2 p-4">
          <Input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="カテゴリ名を入力" />
          <Button onClick={onCreate} disabled={pending || !newName.trim()}>
            追加
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {categories.map((category, index) => (
          <Card key={category.id}>
            <CardContent className="flex flex-col gap-2 p-3 md:flex-row md:items-center">
              <Input
                value={drafts[category.id] ?? category.name}
                onChange={(event) => setDrafts((prev) => ({ ...prev, [category.id]: event.target.value }))}
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => onRename(category.id)} disabled={pending}>
                  名前変更
                </Button>
                <Button size="sm" variant="outline" onClick={() => onMove(category.id, "up")} disabled={pending || index === 0}>
                  上へ
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onMove(category.id, "down")}
                  disabled={pending || index === categories.length - 1}
                >
                  下へ
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onDelete(category.id, category.name)} disabled={pending}>
                  削除
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

