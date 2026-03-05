"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Check, Star } from "lucide-react";
import {
  bulkSetInspirationCategory,
  bulkSetInspirationStar,
  fetchInspirationEntries,
  toggleInspirationStar
} from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { InspirationCategory, InspirationEntry } from "@/lib/types";

type Props = {
  categories: InspirationCategory[];
  initialEntries: InspirationEntry[];
  initialHasMore: boolean;
};

type Tab = "inbox" | "all" | "star" | "categories";

const PAGE_SIZE = 50;

function compactMemo(value: string | null) {
  if (!value) return "";
  return value.length > 120 ? `${value.slice(0, 120)}...` : value;
}

function formatDomain(url: string | null) {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "処理に失敗しました。";
}

export function InspirationListView({ categories, initialEntries, initialHasMore }: Props) {
  const [tab, setTab] = useState<Tab>("all");
  const [queryInput, setQueryInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [entries, setEntries] = useState<InspirationEntry[]>(initialEntries);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [offset, setOffset] = useState(initialEntries.length);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [bulkCategoryValue, setBulkCategoryValue] = useState("none");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(queryInput.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [queryInput]);

  const activeScope = useMemo(() => {
    if (tab === "categories" && selectedCategoryId !== "all") {
      return { scope: "category" as const, categoryId: selectedCategoryId };
    }
    if (tab === "categories") return { scope: "all" as const, categoryId: null };
    if (tab === "inbox") return { scope: "inbox" as const, categoryId: null };
    if (tab === "star") return { scope: "star" as const, categoryId: null };
    return { scope: "all" as const, categoryId: null };
  }, [tab, selectedCategoryId]);

  const load = (mode: "replace" | "append") => {
    setError(null);
    const nextOffset = mode === "replace" ? 0 : offset;
    startTransition(async () => {
      try {
        const result = await fetchInspirationEntries({
          scope: activeScope.scope,
          categoryId: activeScope.categoryId,
          query: debouncedQuery,
          offset: nextOffset,
          limit: PAGE_SIZE
        });
        if (mode === "replace") {
          setEntries(result.items);
          setOffset(result.items.length);
          setSelectedIds({});
        } else {
          setEntries((prev) => [...prev, ...result.items]);
          setOffset((prev) => prev + result.items.length);
        }
        setHasMore(result.hasMore);
      } catch (e) {
        setError(getErrorMessage(e));
      }
    });
  };

  useEffect(() => {
    load("replace");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, selectedCategoryId, debouncedQuery]);

  const toggleSelect = (id: string, value: boolean) => {
    setSelectedIds((prev) => ({ ...prev, [id]: value }));
  };

  const selectedEntryIds = useMemo(() => Object.keys(selectedIds).filter((id) => selectedIds[id]), [selectedIds]);

  const applyBulkCategory = () => {
    if (selectedEntryIds.length === 0) return;
    setError(null);
    startTransition(async () => {
      try {
        await bulkSetInspirationCategory(selectedEntryIds, bulkCategoryValue === "none" ? null : bulkCategoryValue);
        load("replace");
      } catch (e) {
        setError(getErrorMessage(e));
      }
    });
  };

  const applyBulkStar = (isStarred: boolean) => {
    if (selectedEntryIds.length === 0) return;
    setError(null);
    startTransition(async () => {
      try {
        await bulkSetInspirationStar(selectedEntryIds, isStarred);
        setEntries((prev) => prev.map((entry) => (selectedIds[entry.id] ? { ...entry, is_starred: isStarred } : entry)));
      } catch (e) {
        setError(getErrorMessage(e));
      }
    });
  };

  const onToggleStar = (entryId: string, nextValue: boolean) => {
    setEntries((prev) => prev.map((entry) => (entry.id === entryId ? { ...entry, is_starred: nextValue } : entry)));
    startTransition(async () => {
      try {
        await toggleInspirationStar(entryId, nextValue);
      } catch (e) {
        setEntries((prev) => prev.map((entry) => (entry.id === entryId ? { ...entry, is_starred: !nextValue } : entry)));
        setError(getErrorMessage(e));
      }
    });
  };

  return (
    <div className="space-y-4">
      {error ? <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p> : null}

      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <Input placeholder="タイトル / メモ / URL で検索" value={queryInput} onChange={(event) => setQueryInput(event.target.value)} />
        <Button asChild className="md:w-auto">
          <Link href="/inspiration/new">+ 追加</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant={tab === "inbox" ? "default" : "secondary"} size="sm" onClick={() => setTab("inbox")}>
          未分類
        </Button>
        <Button variant={tab === "all" ? "default" : "secondary"} size="sm" onClick={() => setTab("all")}>
          すべて
        </Button>
        <Button variant={tab === "star" ? "default" : "secondary"} size="sm" onClick={() => setTab("star")}>
          お気に入り
        </Button>
        <Button variant={tab === "categories" ? "default" : "secondary"} size="sm" onClick={() => setTab("categories")}>
          カテゴリ
        </Button>
      </div>

      {tab === "categories" ? (
        <Card>
          <CardContent className="space-y-3 p-3">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategoryId === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategoryId("all")}
              >
                すべてのカテゴリ
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategoryId === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategoryId(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/inspiration/categories">カテゴリ管理へ</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="space-y-3 p-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="text-sm text-muted-foreground">{selectedEntryIds.length} 件選択中</div>
            <div className="flex flex-1 flex-wrap gap-2">
              <Select value={bulkCategoryValue} onValueChange={setBulkCategoryValue}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="一括カテゴリ変更" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">未分類（カテゴリなし）</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={applyBulkCategory} disabled={pending || selectedEntryIds.length === 0}>
                カテゴリ適用
              </Button>
              <Button size="sm" variant="outline" onClick={() => applyBulkStar(true)} disabled={pending || selectedEntryIds.length === 0}>
                ★ 一括ON
              </Button>
              <Button size="sm" variant="outline" onClick={() => applyBulkStar(false)} disabled={pending || selectedEntryIds.length === 0}>
                ★ 一括OFF
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {entries.map((entry) => (
              <div key={entry.id} className="rounded-lg border border-border/80 bg-muted/20 p-3">
                <div className="flex items-start gap-3">
                  <label className="relative mt-0.5 inline-flex h-5 w-5 cursor-pointer items-center justify-center">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedIds[entry.id])}
                      onChange={(event) => toggleSelect(entry.id, event.target.checked)}
                      className="peer sr-only"
                    />
                    <span className="h-5 w-5 rounded-md border border-border/80 bg-muted/40 transition-all peer-checked:border-primary peer-checked:bg-primary" />
                    <Check className="pointer-events-none absolute h-3.5 w-3.5 text-primary-foreground opacity-0 transition-opacity peer-checked:opacity-100" />
                  </label>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/inspiration/${entry.id}`} className="font-semibold hover:underline">
                        {entry.title}
                      </Link>
                      {entry.category ? <Badge variant="secondary">{entry.category.name}</Badge> : <Badge variant="secondary">未分類</Badge>}
                      <button
                        type="button"
                        className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-amber-300/50 bg-amber-300/10 text-amber-300 transition hover:scale-105 hover:bg-amber-300/20"
                        onClick={() => onToggleStar(entry.id, !entry.is_starred)}
                        aria-label="お気に入り切り替え"
                      >
                        <Star className={`h-3.5 w-3.5 ${entry.is_starred ? "fill-amber-300" : ""}`} />
                      </button>
                    </div>
                    {entry.url ? (
                      <a href={entry.url} target="_blank" rel="noreferrer" className="mt-1 block text-sm text-sky-300 hover:underline">
                        {formatDomain(entry.url)}
                      </a>
                    ) : null}
                    {entry.memo ? <p className="mt-1 text-sm text-muted-foreground">{compactMemo(entry.memo)}</p> : null}
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleDateString("ja-JP")}</p>
                  </div>
                </div>
              </div>
            ))}
            {entries.length === 0 ? <p className="text-sm text-muted-foreground">データがありません。</p> : null}
          </div>

          {hasMore ? (
            <Button variant="outline" onClick={() => load("append")} disabled={pending}>
              さらに表示
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
