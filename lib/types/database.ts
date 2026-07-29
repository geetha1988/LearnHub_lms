export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  role: "student" | "instructor" | "admin"
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
}

export interface Course {
  id: string
  instructor_id: string
  category_id: string | null
  title: string
  slug: string
  description: string | null
  thumbnail_url: string | null
  preview_video_url: string | null
  price_in_cents: number
  level: "beginner" | "intermediate" | "advanced" | null
  duration_minutes: number | null
  is_published: boolean
  created_at: string
  updated_at: string
}

export type MaterialType = "video" | "audio" | "pdf" | "slides" | "article" | "download"

export interface LessonMaterial {
  id: string
  lesson_id: string
  type: MaterialType
  title: string
  url: string | null
  content: string | null
  file_name: string | null
  duration_minutes: number | null
  order_index: number
  created_at: string
  updated_at: string
}

export interface Lesson {
  id: string
  course_id: string
  title: string
  description: string | null
  video_url: string | null
  duration_minutes: number | null
  order_index: number
  is_free: boolean
  resources: any[]
  materials?: LessonMaterial[]
  created_at: string
  updated_at: string
}

export interface Enrollment {
  id: string
  user_id: string
  course_id: string
  enrolled_at: string
  completed_at: string | null
  progress_percentage: number
}

export interface Progress {
  id: string
  user_id: string
  lesson_id: string
  course_id: string
  completed: boolean
  completed_at: string | null
  last_position_seconds: number
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  user_id: string
  course_id: string
  rating: number
  comment: string | null
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  user_id: string
  course_id: string
  amount_in_cents: number
  stripe_payment_id: string | null
  status: "pending" | "completed" | "failed" | "refunded"
  created_at: string
}
