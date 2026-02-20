"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createSeries, createType, updateWorkItem } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { STATUS_LABELS } from "@/lib/constants";
import type { ContentType, Series, WorkItem } from "@/lib/types";

type Props = {
  item: WorkItem;
  types: ContentType[];
  series: Series[];
};

export function WorkItemEditor({ item, types, series }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(item.work.title);
  const [typeId, setTypeId] = useState(item.type_id);
  const [seriesId, setSeriesId] = useState(item.series_id ?? "none");
  const [status, setStatus] = useState(item.status);
  const [rating, setRating] = useState(item.rating ?? 0);
  const [thumbnailUrl, setThumbnailUrl] = useState(item.work.thumbnail_url ?? "");
  const [whyInterested, setWhyInterested] = useState(item.why_interested ?? "");
  const [reviewText, setReviewText] = useState(item.review_text ?? "");
  const [availabilityEnd, setAvailabilityEnd] = useState(item.availability_end ?? "");
  const [tags, setTags] = useState(item.tags.join(","));
  const [newType, setNewType] = useState("");
  const [newSeries, setNewSeries] = useState("");

  const onSave = () => {
    startTransition(async () => {
      await updateWorkItem({
        id: item.id,
        title,
        type_id: typeId,
        series_id: seriesId === "none" ? null : seriesId,
        status,
        rating,
        review_text: reviewText || null,
        why_interested: whyInterested || null,
        availability_end: availabilityEnd || null,
        thumbnail_url: thumbnailUrl || null,
        tags: tags.split(",").map((v) => v.trim()).filter(Boolean)
      });
      setOpen(false);
      router.refresh();
    });
  };

  const addType = () => {
    if (!newType.trim()) return;
    startTransition(async () => {
      await createType(newType);
      setNewType("");
      router.refresh();
    });
  };

  const addSeries = () => {
    if (!newSeries.trim()) return;
    startTransition(async () => {
      await createSeries(newSeries);
      setNewSeries("");
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          編集
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>作品を編集</DialogTitle>
          <DialogDescription>タイトル・ステータス・評価などを更新します。</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="タイトル" />
          <div className="grid gap-2 md:grid-cols-2">
            <div className="space-y-2">
              <Select value={typeId} onValueChange={setTypeId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {types.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input value={newType} onChange={(e) => setNewType(e.target.value)} placeholder="新しい種別" />
                <Button variant="outline" onClick={addType} disabled={pending}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Select value={seriesId} onValueChange={setSeriesId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">シリーズなし</SelectItem>
                  {series.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input value={newSeries} onChange={(e) => setNewSeries(e.target.value)} placeholder="新しいシリーズ" />
                <Button variant="outline" onClick={addSeries} disabled={pending}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <Select value={status} onValueChange={(value) => setStatus(value as WorkItem["status"])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABELS).map(([k, label]) => (
                <SelectItem key={k} value={k}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">評価: {rating.toFixed(1)}</div>
            <Slider min={0} max={5} step={0.1} value={[rating]} onValueChange={(values) => setRating(values[0] ?? 0)} />
          </div>
          <Input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="サムネイルURL" />
          <Input value={availabilityEnd} type="date" onChange={(e) => setAvailabilityEnd(e.target.value)} />
          <Textarea value={whyInterested} onChange={(e) => setWhyInterested(e.target.value)} placeholder="気になった理由" />
          <Textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="感想" />
          <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="タグ (カンマ区切り)" />
          <Button className="w-full" onClick={onSave} disabled={pending}>
            保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
