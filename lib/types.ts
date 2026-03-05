export type Status = "planned" | "in_progress" | "on_hold" | "completed";

export type ContentType = {
  id: string;
  name: string;
};

export type Series = {
  id: string;
  name: string;
  type_id: string;
};

export type WorkItem = {
  id: string;
  user_id: string;
  status: Status;
  rating: number | null;
  review_text: string | null;
  review_good: string | null;
  review_bad: string | null;
  review_note: string | null;
  why_interested: string | null;
  availability_end: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  type_id: string;
  series_id: string | null;
  tags: string[];
  work: {
    id: string;
    title: string;
    thumbnail_url: string | null;
  };
  content_type: ContentType | null;
  series: Series | null;
};

export type ScopeType = "global" | "type";

export type InspirationCategory = {
  id: string;
  user_id: string;
  name: string;
  sort_order: number;
  created_at: string;
};

export type InspirationEntry = {
  id: string;
  user_id: string;
  title: string;
  url: string | null;
  memo: string | null;
  category_id: string | null;
  is_starred: boolean;
  created_at: string;
  updated_at: string;
  category: Pick<InspirationCategory, "id" | "name" | "sort_order"> | null;
};
