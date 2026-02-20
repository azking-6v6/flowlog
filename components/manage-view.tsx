"use client";

import { useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { updateStatus } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_LABELS } from "@/lib/constants";
import type { WorkItem } from "@/lib/types";

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "更新に失敗しました。時間をおいて再試行してください。";
}

export function ManageView({ items }: { items: WorkItem[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="space-y-3">
      {error ? <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p> : null}
      {items.map((item) => (
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
            {item.review_text ? <p className="text-sm text-muted-foreground">{item.review_text}</p> : null}
            <Button size="sm" variant="outline" disabled={pending} onClick={() => restore(item.id)}>
              未完了に戻す
            </Button>
          </CardContent>
        </Card>
      ))}
      {items.length === 0 ? <p className="text-sm text-muted-foreground">完了した作品はまだありません。</p> : null}
    </div>
  );
}
