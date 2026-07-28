-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users/Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  bio text,
  role text not null default 'student' check (role in ('student', 'instructor', 'admin')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Categories table
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  slug text not null unique,
  description text,
  created_at timestamp with time zone default now()
);

-- Courses table
create table if not exists public.courses (
  id uuid primary key default uuid_generate_v4(),
  instructor_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  slug text not null unique,
  description text,
  thumbnail_url text,
  preview_video_url text,
  price_in_cents integer not null default 0,
  level text check (level in ('beginner', 'intermediate', 'advanced')),
  duration_minutes integer,
  is_published boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Lessons table
create table if not exists public.lessons (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  video_url text,
  duration_minutes integer,
  order_index integer not null,
  is_free boolean default false,
  resources jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enrollments table
create table if not exists public.enrollments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  enrolled_at timestamp with time zone default now(),
  completed_at timestamp with time zone,
  progress_percentage integer default 0,
  unique(user_id, course_id)
);

-- Progress table (tracks lesson completion)
create table if not exists public.progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  completed boolean default false,
  completed_at timestamp with time zone,
  last_position_seconds integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, lesson_id)
);

-- Reviews table
create table if not exists public.reviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, course_id)
);

-- Payments table
create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  amount_in_cents integer not null,
  stripe_payment_id text,
  status text not null check (status in ('pending', 'completed', 'failed', 'refunded')),
  created_at timestamp with time zone default now()
);

-- Create indexes for better query performance
create index if not exists idx_courses_instructor on public.courses(instructor_id);
create index if not exists idx_courses_category on public.courses(category_id);
create index if not exists idx_courses_published on public.courses(is_published);
create index if not exists idx_lessons_course on public.lessons(course_id);
create index if not exists idx_enrollments_user on public.enrollments(user_id);
create index if not exists idx_enrollments_course on public.enrollments(course_id);
create index if not exists idx_progress_user on public.progress(user_id);
create index if not exists idx_progress_lesson on public.progress(lesson_id);
create index if not exists idx_reviews_course on public.reviews(course_id);
