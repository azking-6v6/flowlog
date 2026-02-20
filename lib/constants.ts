export const DEFAULT_CONTENT_TYPES = ["映画", "アニメ", "ゲーム", "漫画"];

export const ACTIVE_STATUSES = ["planned", "in_progress", "on_hold"] as const;
export const ALL_STATUSES = ["planned", "in_progress", "on_hold", "completed"] as const;

export const STATUS_LABELS: Record<(typeof ALL_STATUSES)[number], string> = {
  planned: "予定",
  in_progress: "進行中",
  on_hold: "保留",
  completed: "完了"
};
