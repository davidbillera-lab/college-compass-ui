-- =========================================
-- Step 1: Scholarships schema alignment
-- Idempotent: safe to run multiple times
-- =========================================

-- 1) Ensure updated_at helper exists
create or replace function public.set_updated_at()
returns trigger language plpgsql SET search_path = public as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- 2) Add missing columns to scholarships table
alter table if exists public.scholarships
  add column if not exists provider text,
  add column if not exists url text,
  add column if not exists amount_min_usd int,
  add column if not exists amount_max_usd int,
  add column if not exists deadline_date date,
  add column if not exists rolling_deadline boolean default false,
  add column if not exists location_scope text,
  add column if not exists education_level text,
  add column if not exists major_tags text,
  add column if not exists career_tags text,
  add column if not exists raw_eligibility_text text,
  add column if not exists normalized_criteria jsonb default '{}'::jsonb,
  add column if not exists source_type text,
  add column if not exists source_url text,
  add column if not exists last_crawled_at timestamptz,
  add column if not exists status text default 'active',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- 3) Create updated_at trigger (only if missing)
do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_scholarships_updated_at'
  ) then
    create trigger trg_scholarships_updated_at
    before update on public.scholarships
    for each row execute function public.set_updated_at();
  end if;
end $$;

-- 4) Helpful indexes (safe)
create index if not exists idx_scholarships_status on public.scholarships(status);
create index if not exists idx_scholarships_deadline on public.scholarships(deadline_date);
create index if not exists idx_scholarships_last_crawled on public.scholarships(last_crawled_at);

-- 5) Optional: unique constraint(s) to support upsert
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'scholarships_url_unique'
  ) then
    alter table public.scholarships
      add constraint scholarships_url_unique unique (url);
  end if;
exception
  when others then
    raise notice 'Could not add unique(url). Possibly existing duplicates or url column not suitable yet.';
end $$;

-- 6) Normalize status values (optional safety)
update public.scholarships
set status = 'active'
where status is null;