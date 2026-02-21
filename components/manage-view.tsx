"use client";

import { useMemo, useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { updateStatus } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUS_LABELS } from "@/lib/constants";
import type { WorkItem } from "@/lib/types";

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "更新に失敗しました。時間をおいて再試行してください。";
}

function shouldShowToggle(text: string) {
  return text.length > 120 || text.split("\n").length > 3;
}

function buildReviewSections(item: WorkItem) {
  const good = item.review_good ?? "";
  const bad = item.review_bad ?? "";
  const note = item.review_note ?? item.review_text ?? "";
  const plain = [good, bad, note].filter(Boolean).join("\n");
  return { good, bad, note, plain };
}

export function ManageView({ items }: { items: WorkItem[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [typeId, setTypeId] = useState("all");
  const [status, setStatus] = useState("all");
  const [rating, setRating] = useState("all");
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const typeOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: { id: string; name: string }[] = [];
    for (const item of items) {
      const id = item.content_type?.id;
      const name = item.content_type?.name;
      if (!id || !name || seen.has(id)) continue;
      seen.add(id);
      options.push({ id, name });
    }
    return options.sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const byQuery = item.work.title.toLowerCase().includes(query.toLowerCase());
      const byType = typeId === "all" ? true : item.type_id === typeId;
      const byStatus = status === "all" ? true : item.status === status;
      const byRating =
        rating === "all"
          ? true
          : (() => {
              if (item.rating === null) return false;
              const selected = Number(rating);
              if (selected === 5) return item.rating === 5;
              return item.rating >= selected && item.rating < selected + 1;
            })();
      return byQuery && byType && byStatus && byRating;
    });
  }, [items, query, typeId, status, rating]);

  const restore = (id: string) => {
    setError(null);
    startTransition(async () => {
      try {
        await updateStatus(id, "planned");
      } catch (e) {
        setError(getErrorMessage(e));
      }
    });
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-3">
      {error ? <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p> : null}

      <div className="grid gap-2 md:grid-cols-4">
        <Input placeholder="タイトルで検索" value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select value={typeId} onValueChange={setTypeId}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての種別</SelectItem>
            {typeOptions.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべてのステータス</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, label]) => (
              <SelectItem key={k} value={k}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={rating} onValueChange={setRating}>
          <SelectTrigger>
            <SelectValue placeholder="評価" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての評価</SelectItem>
            <SelectItem value="1">★1</SelectItem>
            <SelectItem value="2">★2</SelectItem>
            <SelectItem value="3">★3</SelectItem>
            <SelectItem value="4">★4</SelectItem>
            <SelectItem value="5">★5</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {filtered.map((item) => {
          const review = buildReviewSections(item);
          const hasReview = Boolean(review.plain);
          const isExpanded = Boolean(expandedIds[item.id]);
          const canToggle = hasReview && shouldShowToggle(review.plain);

          return (
            <Card key={item.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{item.work.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{STATUS_LABELS[item.status]}</Badge>
                  {item.content_type?.name ? <Badge variant="secondary">{item.content_type.name}</Badge> : null}
                  {item.completed_at ? <Badge variant="secondary">完了日: {format(parseISO(item.completed_at), "yyyy-MM-dd")}</Badge> : null}
                  {typeof item.rating === "number" ? <Badge variant="secondary">評価: {item.rating.toFixed(1)}</Badge> : null}
                </div>

                {hasReview ? (
                  <div className={`prose prose-sm prose-invert max-w-none break-words text-muted-foreground ${isExpanded ? "" : "max-h-20 overflow-hidden"}`}>
                    {review.good ? (
                      <div className="mb-3">
                        <div className="mb-1 text-xs font-semibold text-foreground/80">良い点</div>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkBreaks]}
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="mb-2 list-disc pl-5 last:mb-0">{children}</ul>,
                            ol: ({ children }) => <ol className="mb-2 list-decimal pl-5 last:mb-0">{children}</ol>,
                            li: ({ children }) => <li className="mb-1">{children}</li>
                          }}
                        >
                          {review.good}
                        </ReactMarkdown>
                      </div>
                    ) : null}
                    {review.bad ? (
                      <div className="mb-3">
                        <div className="mb-1 text-xs font-semibold text-foreground/80">悪い点</div>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkBreaks]}
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="mb-2 list-disc pl-5 last:mb-0">{children}</ul>,
                            ol: ({ children }) => <ol className="mb-2 list-decimal pl-5 last:mb-0">{children}</ol>,
                            li: ({ children }) => <li className="mb-1">{children}</li>
                          }}
                        >
                          {review.bad}
                        </ReactMarkdown>
                      </div>
                    ) : null}
                    {review.note ? (
                      <div>
                        <div className="mb-1 text-xs font-semibold text-foreground/80">メモ</div>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkBreaks]}
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="mb-2 list-disc pl-5 last:mb-0">{children}</ul>,
                            ol: ({ children }) => <ol className="mb-2 list-decimal pl-5 last:mb-0">{children}</ol>,
                            li: ({ children }) => <li className="mb-1">{children}</li>
                          }}
                        >
                          {review.note}
                        </ReactMarkdown>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="grid grid-cols-3 items-center pt-1">
                  <div />
                  <div className="flex justify-center">
                    {canToggle ? (
                      <button
                        type="button"
                        aria-label={isExpanded ? "折りたたむ" : "展開する"}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/80 bg-muted/40 text-foreground/80 transition-all hover:scale-105 hover:bg-accent hover:text-accent-foreground"
                        onClick={() => toggleExpanded(item.id)}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    ) : null}
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" variant="outline" disabled={pending} onClick={() => restore(item.id)}>
                      未完了に戻す
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 ? <p className="text-sm text-muted-foreground">条件に一致する作品はありません。</p> : null}
    </div>
  );
}
