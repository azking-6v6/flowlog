"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createSeries, createType, createWorkItem } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { STATUS_LABELS } from "@/lib/constants";
import type { ContentType, Series } from "@/lib/types";

type Props = {
  types: ContentType[];
  series: Series[];
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "処理に失敗しました。時間をおいて再試行してください。";
}

export function AddWorkForm({ types, series }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [typeId, setTypeId] = useState(types[0]?.id ?? "");
  const [seriesId, setSeriesId] = useState("none");
  const [status, setStatus] = useState<"planned" | "in_progress" | "on_hold" | "completed">("planned");
  const [rating, setRating] = useState(0);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [availabilityEnd, setAvailabilityEnd] = useState("");
  const [whyInterested, setWhyInterested] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [tags, setTags] = useState("");
  const [newType, setNewType] = useState("");
  const [newSeries, setNewSeries] = useState("");

  const submit = () => {
    if (!title.trim() || !typeId) return;
    setError(null);
    startTransition(async () => {
      try {
        await createWorkItem({
          title,
          type_id: typeId,
          series_id: seriesId === "none" ? null : seriesId,
          status,
          rating,
          review_text: reviewText || null,
          why_interested: whyInterested || null,
          availability_end: availabilityEnd || null,
          thumbnail_url: thumbnailUrl || null,
          tags: tags
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean)
        });
        setTitle("");
        setWhyInterested("");
        setReviewText("");
        setTags("");
        setThumbnailUrl("");
        setAvailabilityEnd("");
        setStatus("planned");
        setRating(0);
        router.push("/");
        router.refresh();
      } catch (e) {
        setError(getErrorMessage(e));
      }
    });
  };

  const addType = () => {
    if (!newType.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        await createType(newType);
        setNewType("");
        router.refresh();
      } catch (e) {
        setError(getErrorMessage(e));
      }
    });
  };

  const addSeries = () => {
    if (!newSeries.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        await createSeries(newSeries);
        setNewSeries("");
        router.refresh();
      } catch (e) {
        setError(getErrorMessage(e));
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>新規作品を追加</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p> : null}
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="タイトル" />
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Select value={typeId} onValueChange={setTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="種別" />
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
              <Input value={newType} onChange={(e) => setNewType(e.target.value)} placeholder="種別を追加" />
              <Button variant="outline" onClick={addType} disabled={pending} aria-label="種別を追加">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Select value={seriesId} onValueChange={setSeriesId}>
              <SelectTrigger>
                <SelectValue placeholder="シリーズ" />
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
              <Input value={newSeries} onChange={(e) => setNewSeries(e.target.value)} placeholder="シリーズを追加" />
              <Button variant="outline" onClick={addSeries} disabled={pending} aria-label="シリーズを追加">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">評価: {rating.toFixed(1)}</div>
          <Slider min={0} max={5} step={0.1} value={[rating]} onValueChange={(values) => setRating(values[0] ?? 0)} />
        </div>

        <Input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="サムネイルURL（任意）" />
        <Input type="date" value={availabilityEnd} onChange={(e) => setAvailabilityEnd(e.target.value)} />
        <Textarea value={whyInterested} onChange={(e) => setWhyInterested(e.target.value)} placeholder="気になった理由" />
        <Textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="感想" />
        <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="タグ（カンマ区切り）" />

        <Button className="w-full" disabled={pending} onClick={submit}>
          追加する
        </Button>
      </CardContent>
    </Card>
  );
}
