"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WorkItemEditor } from "@/components/work-item-editor";
import { STATUS_LABELS } from "@/lib/constants";
import type { ContentType, Series, WorkItem } from "@/lib/types";

type Props = {
  items: WorkItem[];
  types: ContentType[];
  series: Series[];
};

export function LibraryView({ items, types, series }: Props) {
  const [query, setQuery] = useState("");
  const [typeId, setTypeId] = useState("all");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const byQuery = item.work.title.toLowerCase().includes(query.toLowerCase());
      const byType = typeId === "all" ? true : item.type_id === typeId;
      const byStatus = status === "all" ? true : item.status === status;
      return byQuery && byType && byStatus;
    });
  }, [items, query, typeId, status]);

  return (
    <div className="space-y-4">
      <div className="grid gap-2 md:grid-cols-3">
        <Input placeholder="タイトルで検索" value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select value={typeId} onValueChange={setTypeId}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての種別</SelectItem>
            {types.map((type) => (
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
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-3">
              <div className="mb-2 flex gap-3">
                {item.work.thumbnail_url ? (
                  <Image src={item.work.thumbnail_url} alt={item.work.title} width={70} height={94} className="h-[94px] w-[70px] rounded-md object-cover" />
                ) : (
                  <div className="h-[94px] w-[70px] rounded-md bg-muted" />
                )}
                <div className="space-y-2">
                  <div className="line-clamp-2 font-medium">{item.work.title}</div>
                  <Badge variant="secondary">{STATUS_LABELS[item.status]}</Badge>
                  <div className="text-xs text-muted-foreground">{item.content_type?.name ?? "-"}</div>
                </div>
              </div>
              <WorkItemEditor item={item} types={types} series={series} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
