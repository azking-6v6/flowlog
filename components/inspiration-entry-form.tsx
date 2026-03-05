"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { createInspirationEntry, deleteInspirationEntry, updateInspirationEntry } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { InspirationCategory, InspirationEntry } from "@/lib/types";

type Props = {
  categories: InspirationCategory[];
  mode: "new" | "edit";
  entry?: InspirationEntry;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "処理に失敗しました。";
}

export function InspirationEntryForm({ categories, mode, entry }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(entry?.title ?? "");
  const [url, setUrl] = useState(entry?.url ?? "");
  const [memo, setMemo] = useState(entry?.memo ?? "");
  const [categoryId, setCategoryId] = useState(entry?.category_id ?? "none");
  const [isStarred, setIsStarred] = useState(Boolean(entry?.is_starred));

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
    [categories]
  );

  const payload = {
    title,
    url: url.trim() ? url.trim() : null,
    memo: memo.trim() ? memo.trim() : null,
    category_id: categoryId === "none" ? null : categoryId,
    is_starred: isStarred
  };

  const onSave = (continueInput: boolean) => {
    if (!title.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        if (mode === "new") {
          await createInspirationEntry(payload);
          if (continueInput) {
            setTitle("");
            setUrl("");
            setMemo("");
            setCategoryId("none");
            setIsStarred(false);
            return;
          }
        } else if (entry) {
          await updateInspirationEntry(entry.id, payload);
        }
        router.push("/inspiration");
        router.refresh();
      } catch (e) {
        setError(getErrorMessage(e));
      }
    });
  };

  const onDelete = () => {
    if (!entry) return;
    const ok = window.confirm("このインスピレーションを削除しますか？");
    if (!ok) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteInspirationEntry(entry.id);
        router.push("/inspiration");
        router.refresh();
      } catch (e) {
        setError(getErrorMessage(e));
      }
    });
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        {error ? <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p> : null}

        <Input placeholder="タイトル（必須）" value={title} onChange={(event) => setTitle(event.target.value)} />
        <Input placeholder="URL（任意）" value={url} onChange={(event) => setUrl(event.target.value)} />
        <Textarea placeholder="メモ（任意）" value={memo} onChange={(event) => setMemo(event.target.value)} rows={8} />

        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger>
            <SelectValue placeholder="カテゴリ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">未分類（カテゴリなし）</SelectItem>
            {sortedCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="flex items-center gap-2 text-sm">
          <span className="relative inline-flex h-5 w-5 cursor-pointer items-center justify-center">
            <input
              type="checkbox"
              checked={isStarred}
              onChange={(event) => setIsStarred(event.target.checked)}
              className="peer sr-only"
            />
            <span className="h-5 w-5 rounded-md border border-border/80 bg-muted/40 transition-all peer-checked:border-primary peer-checked:bg-primary" />
            <Check className="pointer-events-none absolute h-3.5 w-3.5 text-primary-foreground opacity-0 transition-opacity peer-checked:opacity-100" />
          </span>
          お気に入り
        </label>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onSave(false)} disabled={pending || !title.trim()}>
            保存
          </Button>
          {mode === "new" ? (
            <Button variant="outline" onClick={() => onSave(true)} disabled={pending || !title.trim()}>
              保存して続ける
            </Button>
          ) : null}
          {mode === "edit" ? (
            <Button variant="destructive" onClick={onDelete} disabled={pending}>
              削除
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
