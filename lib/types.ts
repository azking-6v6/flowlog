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
