-- Enable Row Level Security on all tables
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.progress enable row level security;
alter table public.reviews enable row level security;
alter table public.payments enable row level security;

-- Profiles policies
create policy "Users can view all profiles"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Categories policies (public read, admin write)
create policy "Anyone can view categories"
  on public.categories for select
  using (true);

create policy "Admins can insert categories"
  on public.categories for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update categories"
  on public.categories for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Courses policies
create policy "Anyone can view published courses"
  on public.courses for select
  using (is_published = true or instructor_id = auth.uid());

create policy "Instructors can insert own courses"
  on public.courses for insert
  with check (
    auth.uid() = instructor_id and
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('instructor', 'admin')
    )
  );

create policy "Instructors can update own courses"
  on public.courses for update
  using (auth.uid() = instructor_id);

create policy "Instructors can delete own courses"
  on public.courses for delete
  using (auth.uid() = instructor_id);

-- Lessons policies
create policy "Anyone can view lessons of published courses"
  on public.lessons for select
  using (
    exists (
      select 1 from public.courses
      where id = lessons.course_id
      and (is_published = true or instructor_id = auth.uid())
    )
  );

create policy "Instructors can manage own course lessons"
  on public.lessons for all
  using (
    exists (
      select 1 from public.courses
      where id = lessons.course_id and instructor_id = auth.uid()
    )
  );

-- Enrollments policies
create policy "Users can view own enrollments"
  on public.enrollments for select
  using (auth.uid() = user_id);

create policy "Users can enroll in courses"
  on public.enrollments for insert
  with check (auth.uid() = user_id);

create policy "Users can update own enrollments"
  on public.enrollments for update
  using (auth.uid() = user_id);

-- Progress policies
create policy "Users can view own progress"
  on public.progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on public.progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on public.progress for update
  using (auth.uid() = user_id);

-- Reviews policies
create policy "Anyone can view reviews"
  on public.reviews for select
  using (true);

create policy "Users can insert own reviews"
  on public.reviews for insert
  with check (auth.uid() = user_id);

create policy "Users can update own reviews"
  on public.reviews for update
  using (auth.uid() = user_id);

create policy "Users can delete own reviews"
  on public.reviews for delete
  using (auth.uid() = user_id);

-- Payments policies
create policy "Users can view own payments"
  on public.payments for select
  using (auth.uid() = user_id);

create policy "Users can insert own payments"
  on public.payments for insert
  with check (auth.uid() = user_id);
