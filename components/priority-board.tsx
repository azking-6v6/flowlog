"use client";

import { useMemo, useState, useTransition } from "react";
import { format, differenceInCalendarDays, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { DndContext, PointerSensor, TouchSensor, closestCenter, useDraggable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import { reorder, updateStatus } from "@/app/actions";
import { WorkItemEditor } from "@/components/work-item-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ContentType, Series, WorkItem } from "@/lib/types";

type Props = {
  items: WorkItem[];
  types: ContentType[];
  series: Series[];
  globalOrder: string[];
  typeOrderMap: Record<string, string[]>;
};

type Block =
  | { key: string; kind: "series"; seriesName: string; itemIds: string[] }
  | { key: string; kind: "single"; itemIds: [string] };

function typeNameFor(item: WorkItem, types: ContentType[]) {
  return types.find((t) => t.id === item.type_id)?.name ?? "不明";
}

function daysLeft(dateValue: string | null) {
  if (!dateValue) return null;
  return differenceInCalendarDays(parseISO(dateValue), new Date());
}

function SortableWorkCard({
  item,
  types,
  series,
  onComplete
}: {
  item: WorkItem;
  types: ContentType[];
  series: Series[];
  onComplete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const left = daysLeft(item.availability_end);

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="mb-3 overflow-hidden">
        <CardContent className="p-0">
          <div className="flex gap-3 p-3">
            <div {...attributes} {...listeners} className="w-5 shrink-0 cursor-grab touch-none select-none text-muted-foreground">
              ::
            </div>
            {item.work.thumbnail_url ? (
              <Image src={item.work.thumbnail_url} alt={item.work.title} width={74} height={104} className="h-[104px] w-[74px] rounded-md object-cover" />
            ) : (
              <div className="h-[104px] w-[74px] rounded-md bg-muted" />
            )}
            <div className="min-w-0 flex-1 space-y-2">
              <div className="line-clamp-2 font-medium">{item.work.title}</div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{typeNameFor(item, types)}</Badge>
                {item.series?.name ? <Badge variant="secondary">{item.series.name}</Badge> : null}
                {left !== null && left <= 7 ? <Badge variant="danger">期限まで{left}日</Badge> : null}
              </div>
              <div className="text-xs text-muted-foreground">{item.tags.join(" / ")}</div>
              {item.availability_end ? <div className="text-xs text-muted-foreground">期限: {format(parseISO(item.availability_end), "yyyy-MM-dd")}</div> : null}
              <div className="flex gap-2">
                <WorkItemEditor item={item} types={types} series={series} />
                <Button size="sm" onClick={onComplete}>
                  完了
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DraggableSeriesWrapper({
  blockKey,
  title,
  children
}: {
  blockKey: string;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `series-handle:${blockKey.replace("series:", "")}`
  });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <motion.details
      ref={setNodeRef}
      style={style}
      open
      className="rounded-xl border border-border bg-card/60 p-3"
    >
      <summary
        {...attributes}
        {...listeners}
        className="mb-3 cursor-grab touch-none select-none text-sm font-semibold"
      >
        {title}
      </summary>
      {children}
    </motion.details>
  );
}

export function PriorityBoard({ items, types, series, globalOrder, typeOrderMap }: Props) {
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState("all");
  const [localGlobal, setLocalGlobal] = useState(globalOrder);
  const [localTypeMap, setLocalTypeMap] = useState(typeOrderMap);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 140, tolerance: 10 } })
  );

  const currentOrder = useMemo(() => (filter === "all" ? localGlobal : localTypeMap[filter] ?? []), [filter, localGlobal, localTypeMap]);

  const visibleItems = useMemo(() => {
    const filtered = filter === "all" ? items : items.filter((item) => item.type_id === filter);
    const map = new Map(currentOrder.map((id, idx) => [id, idx]));
    return [...filtered].sort((a, b) => (map.get(a.id) ?? 999999) - (map.get(b.id) ?? 999999));
  }, [filter, items, currentOrder]);

  const itemById = useMemo(() => new Map(visibleItems.map((v) => [v.id, v])), [visibleItems]);

  const blocks = useMemo(() => {
    const result: Block[] = [];
    const usedSeries = new Set<string>();

    for (const item of visibleItems) {
      if (item.series?.id) {
        if (usedSeries.has(item.series.id)) continue;
        usedSeries.add(item.series.id);
        const ids = visibleItems.filter((v) => v.series?.id === item.series!.id).map((v) => v.id);
        result.push({
          key: `series:${item.series.id}`,
          kind: "series",
          seriesName: item.series.name,
          itemIds: ids
        });
      } else {
        result.push({
          key: `single:${item.id}`,
          kind: "single",
          itemIds: [item.id]
        });
      }
    }
    return result;
  }, [visibleItems]);

  const blockByItemId = useMemo(() => {
    const map = new Map<string, string>();
    for (const block of blocks) {
      for (const id of block.itemIds) map.set(id, block.key);
    }
    return map;
  }, [blocks]);

  const persistOrder = (nextOrder: string[]) => {
    if (filter === "all") {
      setLocalGlobal(nextOrder);
      startTransition(async () => {
        await reorder("global", null, nextOrder);
      });
      return;
    }
    setLocalTypeMap((prev) => ({ ...prev, [filter]: nextOrder }));
    startTransition(async () => {
      await reorder("type", filter, nextOrder);
    });
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const activeBlockKey = activeId.startsWith("series-handle:") ? `series:${activeId.replace("series-handle:", "")}` : blockByItemId.get(activeId);
    const overBlockKey = blockByItemId.get(overId);
    if (!activeBlockKey || !overBlockKey) return;

    // 同じシリーズ内のみ、シリーズ内部の順序を調整する
    if (activeBlockKey === overBlockKey) {
      const block = blocks.find((b) => b.key === activeBlockKey);
      if (!block || block.kind !== "series") return;

      const oldIndex = block.itemIds.indexOf(activeId);
      const newIndex = block.itemIds.indexOf(overId);
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;

      const movedSeriesIds = arrayMove(block.itemIds, oldIndex, newIndex);
      const seriesSet = new Set(block.itemIds);
      const targetPositions: number[] = [];
      currentOrder.forEach((id, idx) => {
        if (seriesSet.has(id)) targetPositions.push(idx);
      });

      const nextOrder = [...currentOrder];
      targetPositions.forEach((pos, i) => {
        nextOrder[pos] = movedSeriesIds[i];
      });
      persistOrder(nextOrder);
      return;
    }

    // 別ブロック上にドロップした場合はブロック単位で移動する
    const blockOrder = blocks.map((b) => b.key);
    const oldBlockIndex = blockOrder.indexOf(activeBlockKey);
    const newBlockIndex = blockOrder.indexOf(overBlockKey);
    if (oldBlockIndex < 0 || newBlockIndex < 0) return;

    const movedBlockOrder = arrayMove(blockOrder, oldBlockIndex, newBlockIndex);
    const blockMap = new Map(blocks.map((b) => [b.key, b]));
    const nextOrder: string[] = [];

    for (const key of movedBlockOrder) {
      const b = blockMap.get(key);
      if (!b) continue;
      nextOrder.push(...b.itemIds);
    }

    persistOrder(nextOrder);
  };

  const onComplete = (id: string) => {
    startTransition(async () => {
      await updateStatus(id, "completed");
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={filter === "all" ? "default" : "secondary"} onClick={() => setFilter("all")}>
          すべて
        </Button>
        {types.map((type) => (
          <Button key={type.id} size="sm" variant={filter === type.id ? "default" : "secondary"} onClick={() => setFilter(type.id)}>
            {type.name}
          </Button>
        ))}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={visibleItems.map((v) => v.id)} strategy={verticalListSortingStrategy}>
          {blocks.map((block, index) => {
            if (block.kind === "series") {
              return (
                <DraggableSeriesWrapper
                  key={block.key}
                  blockKey={block.key}
                  title={
                    <motion.span
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="inline-block"
                    >
                      {block.seriesName}
                    </motion.span>
                  }
                >
                  {block.itemIds.map((id) => {
                    const item = itemById.get(id);
                    if (!item) return null;
                    return <SortableWorkCard key={id} item={item} types={types} series={series} onComplete={() => onComplete(id)} />;
                  })}
                </DraggableSeriesWrapper>
              );
            }

            const id = block.itemIds[0];
            const item = itemById.get(id);
            if (!item) return null;
            return <SortableWorkCard key={id} item={item} types={types} series={series} onComplete={() => onComplete(id)} />;
          })}
        </SortableContext>
      </DndContext>

      {pending ? <div className="text-xs text-muted-foreground">保存中...</div> : null}
    </div>
  );
}
