-- Lesson materials: multiple pieces of content per lesson
-- (video, audio, pdf, slides, article, download)

create table if not exists public.lesson_materials (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  type text not null check (type in ('video', 'audio', 'pdf', 'slides', 'article', 'download')),
  title text not null,
  url text,
  content text,
  file_name text,
  duration_minutes int,
  order_index int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lesson_materials_lesson_order_idx
  on public.lesson_materials (lesson_id, order_index);

-- Keep updated_at fresh (reuses handle_updated_at from script 003)
drop trigger if exists set_updated_at on public.lesson_materials;
create trigger set_updated_at
  before update on public.lesson_materials
  for each row
  execute function public.handle_updated_at();

-- Row Level Security
alter table public.lesson_materials enable row level security;

-- Students/visitors can read materials when the parent course is published;
-- instructors can always read their own course materials.
drop policy if exists "View materials of published courses" on public.lesson_materials;
create policy "View materials of published courses"
  on public.lesson_materials for select
  using (
    exists (
      select 1
      from public.lessons l
      join public.courses c on c.id = l.course_id
      where l.id = lesson_materials.lesson_id
        and (c.is_published = true or c.instructor_id = auth.uid())
    )
  );

-- Instructors can fully manage materials belonging to their own courses.
drop policy if exists "Instructors manage own course materials" on public.lesson_materials;
create policy "Instructors manage own course materials"
  on public.lesson_materials for all
  using (
    exists (
      select 1
      from public.lessons l
      join public.courses c on c.id = l.course_id
      where l.id = lesson_materials.lesson_id
        and c.instructor_id = auth.uid()
    )
  );
