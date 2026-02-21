alter table public.work_items
add column if not exists review_good text,
add column if not exists review_bad text,
add column if not exists review_note text;

update public.work_items
set review_note = review_text
where review_note is null
  and review_text is not null
  and btrim(review_text) <> '';
