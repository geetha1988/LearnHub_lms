"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

// ---------------------------------------------------------------------
// Demo data definitions (single source of truth for seeding + reset)
// ---------------------------------------------------------------------

type DemoUser = {
  email: string
  password: string
  full_name: string
  role: "admin" | "instructor" | "student"
  bio: string
}

const DEMO_USERS: DemoUser[] = [
  { email: "admin@learnhub.test", password: "Admin123!", full_name: "Admin User", role: "admin", bio: "Platform administrator." },
  { email: "sarah.instructor@learnhub.test", password: "Instructor123!", full_name: "Sarah Chen", role: "instructor", bio: "Senior software engineer and full-stack web development instructor with 10+ years of experience." },
  { email: "james.instructor@learnhub.test", password: "Instructor123!", full_name: "James Wright", role: "instructor", bio: "Data scientist and educator passionate about making machine learning accessible." },
  { email: "alex.student@learnhub.test", password: "Student123!", full_name: "Alex Johnson", role: "student", bio: "Aspiring web developer." },
  { email: "maria.student@learnhub.test", password: "Student123!", full_name: "Maria Garcia", role: "student", bio: "Career switcher learning to code." },
  { email: "john.student@learnhub.test", password: "Student123!", full_name: "John Smith", role: "student", bio: "Lifelong learner." },
]

// Everything except the admin account is treated as removable sample data.
const SEEDED_DEMO_EMAILS = DEMO_USERS.filter((u) => u.role !== "admin").map((u) => u.email)

const DEMO_CATEGORIES = [
  { slug: "web-development", name: "Web Development", description: "Build modern websites and web apps." },
  { slug: "data-science", name: "Data Science", description: "Analyze data and build ML models." },
  { slug: "design", name: "Design", description: "Craft beautiful, usable interfaces." },
  { slug: "business", name: "Business", description: "Launch and grow your ventures." },
]

const C = (n: number) => `c0000000-0000-4000-8000-00000000000${n}`
const L = (course: number, lesson: number) => `d${course}000000-0000-4000-8000-00000000000${lesson}`
// Deterministic material id: course (1-6), lesson (1-4), material index (1-9)
const M = (course: number, lesson: number, mat: number) =>
  `e${course}${lesson}00000-0000-4000-8000-00000000000${mat}`

// Public, hotlink-friendly sample media used for the demo materials.
const SAMPLE = {
  video: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  video2: "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  pdf: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
}

type DemoMaterial = {
  type: "video" | "audio" | "pdf" | "slides" | "article" | "download"
  title: string
  url?: string
  content?: string
  file_name?: string
  duration?: number
}

/**
 * Builds a representative spread of materials for a lesson so every content
 * type is demonstrated across the seeded catalog. Every lesson gets a video and
 * a written article; lessons rotate through pdf, slides, audio, and downloads.
 */
function buildMaterials(lesson: { title: string; description: string; duration: number }, li: number): DemoMaterial[] {
  const materials: DemoMaterial[] = [
    {
      type: "video",
      title: `${lesson.title} — Video Lecture`,
      url: li % 2 === 0 ? SAMPLE.video2 : SAMPLE.video,
      duration: lesson.duration,
    },
    {
      type: "article",
      title: `${lesson.title} — Reading`,
      content:
        `${lesson.description}\n\n` +
        `In this written lesson we go deeper into the concepts covered in the video. ` +
        `Read through the notes below, follow along with the examples, and try each ` +
        `step yourself before moving on.\n\n` +
        `Key takeaways:\n` +
        `• Understand the core idea and why it matters.\n` +
        `• Work through the example step by step.\n` +
        `• Complete the practice exercise at the end.\n\n` +
        `When you're comfortable with this material, mark the lesson complete and continue ` +
        `to the next one.`,
    },
  ]

  // Rotate a richer material type into each lesson by position.
  switch (li % 4) {
    case 0:
      materials.push({ type: "pdf", title: `${lesson.title} — Slides (PDF)`, url: SAMPLE.pdf })
      break
    case 1:
      materials.push({ type: "slides", title: `${lesson.title} — Presentation`, url: SAMPLE.pdf })
      break
    case 2:
      materials.push({
        type: "audio",
        title: `${lesson.title} — Audio Recap`,
        url: SAMPLE.audio,
        duration: 4,
      })
      break
    default:
      break
  }

  // Every lesson ships with a downloadable resource.
  materials.push({
    type: "download",
    title: `${lesson.title} — Exercise Files`,
    url: SAMPLE.pdf,
    file_name: `${lesson.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-worksheet.pdf`,
  })

  return materials
}

type DemoCourse = {
  id: string
  instructorEmail: string
  categorySlug: string
  title: string
  slug: string
  description: string
  price_in_cents: number
  level: "beginner" | "intermediate" | "advanced"
  duration_minutes: number
  is_published: boolean
  ageDays: number
  lessons: { title: string; description: string; duration: number; is_free: boolean }[]
}

const DEMO_COURSES: DemoCourse[] = [
  {
    id: C(1), instructorEmail: "sarah.instructor@learnhub.test", categorySlug: "web-development",
    title: "Modern React from Scratch", slug: "modern-react-from-scratch",
    description: "Learn React 19 by building real projects. Covers hooks, server components, state management, and deployment.",
    price_in_cents: 4999, level: "beginner", duration_minutes: 480, is_published: true, ageDays: 40,
    lessons: [
      { title: "Introduction & Setup", description: "Set up your development environment and create your first React app.", duration: 25, is_free: true },
      { title: "Components & Props", description: "Understand how components and props work in React.", duration: 35, is_free: false },
      { title: "State & Hooks", description: "Manage state with useState and useEffect.", duration: 45, is_free: false },
      { title: "Building a Project", description: "Put it all together by building a todo app.", duration: 60, is_free: false },
    ],
  },
  {
    id: C(2), instructorEmail: "sarah.instructor@learnhub.test", categorySlug: "web-development",
    title: "Full-Stack Next.js Mastery", slug: "full-stack-nextjs-mastery",
    description: "Build production-grade full-stack apps with Next.js, server actions, databases, and authentication.",
    price_in_cents: 8999, level: "intermediate", duration_minutes: 720, is_published: true, ageDays: 30,
    lessons: [
      { title: "App Router Basics", description: "Learn the Next.js App Router and routing conventions.", duration: 40, is_free: true },
      { title: "Server Components", description: "Fetch data with React Server Components.", duration: 50, is_free: false },
      { title: "Server Actions & Forms", description: "Handle mutations with server actions.", duration: 55, is_free: false },
      { title: "Auth & Deployment", description: "Add authentication and deploy to Vercel.", duration: 65, is_free: false },
    ],
  },
  {
    id: C(3), instructorEmail: "james.instructor@learnhub.test", categorySlug: "data-science",
    title: "Python for Data Science", slug: "python-for-data-science",
    description: "Master data analysis with Python, pandas, NumPy, and visualization libraries through hands-on projects.",
    price_in_cents: 5999, level: "beginner", duration_minutes: 600, is_published: true, ageDays: 25,
    lessons: [
      { title: "Python Refresher", description: "Quick tour of Python syntax for data work.", duration: 30, is_free: true },
      { title: "NumPy Arrays", description: "Work with numerical data using NumPy.", duration: 45, is_free: false },
      { title: "Pandas DataFrames", description: "Clean and analyze data with pandas.", duration: 55, is_free: false },
      { title: "Data Visualization", description: "Create charts with matplotlib and seaborn.", duration: 50, is_free: false },
    ],
  },
  {
    id: C(4), instructorEmail: "james.instructor@learnhub.test", categorySlug: "data-science",
    title: "Machine Learning Fundamentals", slug: "machine-learning-fundamentals",
    description: "Understand core ML algorithms, model training, and evaluation with scikit-learn and real datasets.",
    price_in_cents: 9999, level: "advanced", duration_minutes: 840, is_published: true, ageDays: 20,
    lessons: [
      { title: "ML Landscape", description: "Overview of machine learning types.", duration: 35, is_free: true },
      { title: "Regression", description: "Build and evaluate regression models.", duration: 60, is_free: false },
      { title: "Classification", description: "Train classifiers and measure accuracy.", duration: 65, is_free: false },
      { title: "Model Deployment", description: "Ship a model to production.", duration: 70, is_free: false },
    ],
  },
  {
    id: C(5), instructorEmail: "sarah.instructor@learnhub.test", categorySlug: "design",
    title: "UI/UX Design Essentials", slug: "ui-ux-design-essentials",
    description: "Learn the principles of great interface design, prototyping, and user research from the ground up.",
    price_in_cents: 0, level: "beginner", duration_minutes: 360, is_published: true, ageDays: 15,
    lessons: [
      { title: "Design Principles", description: "Foundations of visual design.", duration: 30, is_free: true },
      { title: "Color & Typography", description: "Choose colors and type effectively.", duration: 35, is_free: true },
      { title: "Prototyping", description: "Prototype interfaces with Figma.", duration: 40, is_free: false },
      { title: "User Research", description: "Validate designs with real users.", duration: 45, is_free: false },
    ],
  },
  {
    id: C(6), instructorEmail: "james.instructor@learnhub.test", categorySlug: "business",
    title: "Startup Fundamentals", slug: "startup-fundamentals",
    description: "From idea to launch: validation, business models, fundraising, and growth strategies for founders.",
    price_in_cents: 3999, level: "intermediate", duration_minutes: 300, is_published: false, ageDays: 5,
    lessons: [
      { title: "Finding an Idea", description: "Identify problems worth solving.", duration: 30, is_free: true },
      { title: "Validating Demand", description: "Test your idea before building.", duration: 35, is_free: false },
      { title: "Business Models", description: "Design a sustainable business model.", duration: 40, is_free: false },
      { title: "Fundraising", description: "Raise capital for your startup.", duration: 45, is_free: false },
    ],
  },
]

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString()
}

// ---------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------

async function getCurrentProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  return profile ? { userId: user.id, role: profile.role as string } : { userId: user.id, role: "student" }
}

async function requireAdmin() {
  const profile = await getCurrentProfile()
  if (!profile) throw new Error("Not authenticated")
  if (profile.role !== "admin") throw new Error("Not authorized. Admin access required.")
  return profile
}

/**
 * True when the platform has no admin account yet. Used to allow the public
 * /setup page to run the very first seed (bootstrap) before self-locking.
 */
export async function adminExists(): Promise<boolean> {
  try {
    const admin = createAdminClient()
    const { count } = await admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin")
    return (count ?? 0) > 0
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------
// Seeding
// ---------------------------------------------------------------------

/**
 * Creates all demo accounts (via the Admin API so they can actually log in)
 * plus sample categories, courses, lessons, enrollments, progress, reviews,
 * and payments. Idempotent: safe to run multiple times.
 *
 * Allowed when there is no admin yet (bootstrap) OR the caller is an admin.
 */
export async function seedSampleData(): Promise<{ success: boolean; message: string }> {
  // Authorization: bootstrap-friendly.
  const hasAdmin = await adminExists()
  if (hasAdmin) {
    try {
      await requireAdmin()
    } catch {
      return { success: false, message: "Sample data already exists. Log in as an admin to re-seed." }
    }
  }

  let admin
  try {
    admin = createAdminClient()
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Admin client unavailable" }
  }

  try {
    // 1. Users (create or reuse) → build email→id map.
    const { data: existing, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (listErr) return { success: false, message: `Failed to list users: ${listErr.message}` }

    const idByEmail = new Map<string, string>()
    for (const u of existing?.users ?? []) {
      if (u.email) idByEmail.set(u.email, u.id)
    }

    for (const demo of DEMO_USERS) {
      if (idByEmail.has(demo.email)) continue
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: demo.email,
        password: demo.password,
        email_confirm: true,
        user_metadata: { full_name: demo.full_name, role: demo.role },
      })
      if (createErr || !created?.user) {
        return { success: false, message: `Failed to create ${demo.email}: ${createErr?.message ?? "unknown error"}` }
      }
      idByEmail.set(demo.email, created.user.id)
    }

    // 2. Profiles (upsert so role/name/bio are always correct).
    const profileRows = DEMO_USERS.map((u) => ({
      id: idByEmail.get(u.email)!,
      email: u.email,
      full_name: u.full_name,
      role: u.role,
      bio: u.bio,
    }))
    const { error: profileErr } = await admin.from("profiles").upsert(profileRows, { onConflict: "id" })
    if (profileErr) return { success: false, message: `Failed to seed profiles: ${profileErr.message}` }

    // 3. Categories (upsert by slug) → build slug→id map.
    const { error: catErr } = await admin
      .from("categories")
      .upsert(DEMO_CATEGORIES, { onConflict: "slug" })
    if (catErr) return { success: false, message: `Failed to seed categories: ${catErr.message}` }

    const { data: cats } = await admin.from("categories").select("id, slug")
    const catIdBySlug = new Map<string, string>((cats ?? []).map((c: { id: string; slug: string }) => [c.slug, c.id]))

    // 4. Courses (upsert by id).
    const courseRows = DEMO_COURSES.map((c) => ({
      id: c.id,
      instructor_id: idByEmail.get(c.instructorEmail)!,
      category_id: catIdBySlug.get(c.categorySlug) ?? null,
      title: c.title,
      slug: c.slug,
      description: c.description,
      thumbnail_url: "/placeholder.svg?height=400&width=600",
      price_in_cents: c.price_in_cents,
      level: c.level,
      duration_minutes: c.duration_minutes,
      is_published: c.is_published,
      created_at: daysAgo(c.ageDays),
    }))
    const { error: courseErr } = await admin.from("courses").upsert(courseRows, { onConflict: "id" })
    if (courseErr) return { success: false, message: `Failed to seed courses: ${courseErr.message}` }

    // 5. Lessons (upsert by id).
    const lessonRows = DEMO_COURSES.flatMap((c, ci) =>
      c.lessons.map((l, li) => ({
        id: L(ci + 1, li + 1),
        course_id: c.id,
        title: l.title,
        description: l.description,
        video_url: null,
        duration_minutes: l.duration,
        order_index: li + 1,
        is_free: l.is_free,
        resources: [],
      })),
    )
    const { error: lessonErr } = await admin.from("lessons").upsert(lessonRows, { onConflict: "id" })
    if (lessonErr) return { success: false, message: `Failed to seed lessons: ${lessonErr.message}` }

    // 5b. Lesson materials (upsert by id) — the actual learning content.
    const materialRows = DEMO_COURSES.flatMap((c, ci) =>
      c.lessons.flatMap((l, li) =>
        buildMaterials(l, li).map((m, mi) => ({
          id: M(ci + 1, li + 1, mi + 1),
          lesson_id: L(ci + 1, li + 1),
          type: m.type,
          title: m.title,
          url: m.url ?? null,
          content: m.content ?? null,
          file_name: m.file_name ?? null,
          duration_minutes: m.duration ?? null,
          order_index: mi,
        })),
      ),
    )
    const { error: materialErr } = await admin.from("lesson_materials").upsert(materialRows, { onConflict: "id" })
    if (materialErr) return { success: false, message: `Failed to seed lesson materials: ${materialErr.message}` }

    // Convenience ids.
    const alex = idByEmail.get("alex.student@learnhub.test")!
    const maria = idByEmail.get("maria.student@learnhub.test")!
    const john = idByEmail.get("john.student@learnhub.test")!

    // 6. Enrollments (upsert by user_id, course_id).
    const enrollmentRows = [
      { user_id: alex, course_id: C(1), enrolled_at: daysAgo(20), completed_at: null, progress_percentage: 50 },
      { user_id: alex, course_id: C(5), enrolled_at: daysAgo(10), completed_at: daysAgo(2), progress_percentage: 100 },
      { user_id: maria, course_id: C(1), enrolled_at: daysAgo(18), completed_at: null, progress_percentage: 25 },
      { user_id: maria, course_id: C(3), enrolled_at: daysAgo(12), completed_at: null, progress_percentage: 75 },
      { user_id: john, course_id: C(2), enrolled_at: daysAgo(8), completed_at: null, progress_percentage: 0 },
    ]
    const { error: enrollErr } = await admin
      .from("enrollments")
      .upsert(enrollmentRows, { onConflict: "user_id,course_id" })
    if (enrollErr) return { success: false, message: `Failed to seed enrollments: ${enrollErr.message}` }

    // 7. Progress (upsert by user_id, lesson_id).
    const progressRows = [
      { user_id: alex, lesson_id: L(1, 1), course_id: C(1), completed: true, completed_at: daysAgo(19) },
      { user_id: alex, lesson_id: L(1, 2), course_id: C(1), completed: true, completed_at: daysAgo(15) },
      { user_id: alex, lesson_id: L(5, 1), course_id: C(5), completed: true, completed_at: daysAgo(9) },
      { user_id: alex, lesson_id: L(5, 2), course_id: C(5), completed: true, completed_at: daysAgo(8) },
      { user_id: alex, lesson_id: L(5, 3), course_id: C(5), completed: true, completed_at: daysAgo(4) },
      { user_id: alex, lesson_id: L(5, 4), course_id: C(5), completed: true, completed_at: daysAgo(2) },
      { user_id: maria, lesson_id: L(1, 1), course_id: C(1), completed: true, completed_at: daysAgo(17) },
      { user_id: maria, lesson_id: L(3, 1), course_id: C(3), completed: true, completed_at: daysAgo(11) },
      { user_id: maria, lesson_id: L(3, 2), course_id: C(3), completed: true, completed_at: daysAgo(9) },
      { user_id: maria, lesson_id: L(3, 3), course_id: C(3), completed: true, completed_at: daysAgo(6) },
    ]
    const { error: progErr } = await admin.from("progress").upsert(progressRows, { onConflict: "user_id,lesson_id" })
    if (progErr) return { success: false, message: `Failed to seed progress: ${progErr.message}` }

    // 8. Reviews (upsert by user_id, course_id).
    const reviewRows = [
      { user_id: alex, course_id: C(1), rating: 5, comment: "Fantastic course! The projects really helped me understand React.", created_at: daysAgo(12) },
      { user_id: maria, course_id: C(1), rating: 4, comment: "Great content, would love more advanced examples.", created_at: daysAgo(10) },
      { user_id: alex, course_id: C(5), rating: 5, comment: "The best design intro I have taken. Highly recommended.", created_at: daysAgo(2) },
      { user_id: maria, course_id: C(3), rating: 5, comment: "James explains complex topics so clearly.", created_at: daysAgo(5) },
    ]
    const { error: reviewErr } = await admin.from("reviews").upsert(reviewRows, { onConflict: "user_id,course_id" })
    if (reviewErr) return { success: false, message: `Failed to seed reviews: ${reviewErr.message}` }

    // 9. Payments (delete demo rows first, then insert — no natural unique key).
    await admin.from("payments").delete().like("stripe_payment_id", "pi_demo_%")
    const paymentRows = [
      { user_id: alex, course_id: C(1), amount_in_cents: 4999, stripe_payment_id: "pi_demo_001", status: "completed", created_at: daysAgo(20) },
      { user_id: maria, course_id: C(1), amount_in_cents: 4999, stripe_payment_id: "pi_demo_002", status: "completed", created_at: daysAgo(18) },
      { user_id: maria, course_id: C(3), amount_in_cents: 5999, stripe_payment_id: "pi_demo_003", status: "completed", created_at: daysAgo(12) },
      { user_id: john, course_id: C(2), amount_in_cents: 8999, stripe_payment_id: "pi_demo_004", status: "completed", created_at: daysAgo(8) },
    ]
    const { error: payErr } = await admin.from("payments").insert(paymentRows)
    if (payErr) return { success: false, message: `Failed to seed payments: ${payErr.message}` }

    revalidatePath("/")
    revalidatePath("/courses")
    revalidatePath("/admin")

    return {
      success: true,
      message: "Sample data created. You can now log in with any demo account (see credentials below).",
    }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Seeding failed" }
  }
}

/**
 * Removes all seeded sample data so the platform can be deployed fresh.
 * Deletes the demo instructor/student accounts (excluding admin), which
 * cascades to their courses, lessons, enrollments, progress, reviews, and
 * payments via ON DELETE CASCADE. Real user accounts are untouched.
 */
export async function resetSampleData(): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdmin()
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Authorization failed" }
  }

  let admin
  try {
    admin = createAdminClient()
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Admin client unavailable" }
  }

  let deleted = 0
  const errors: string[] = []

  const { data, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (listError) {
    return { success: false, message: `Failed to list users: ${listError.message}` }
  }

  const targets = (data?.users ?? []).filter((u) => u.email && SEEDED_DEMO_EMAILS.includes(u.email))

  for (const target of targets) {
    const { error: delError } = await admin.auth.admin.deleteUser(target.id)
    if (delError) {
      errors.push(`${target.email}: ${delError.message}`)
    } else {
      deleted += 1
    }
  }

  // Clean up any lingering demo payments (in case those users were already gone).
  await admin.from("payments").delete().like("stripe_payment_id", "pi_demo_%")

  revalidatePath("/admin")
  revalidatePath("/")
  revalidatePath("/courses")

  if (errors.length > 0) {
    return {
      success: false,
      message: `Removed ${deleted} demo account(s), but some failed: ${errors.join("; ")}`,
    }
  }

  return {
    success: true,
    message:
      deleted === 0
        ? "No sample data found. The platform is already clean."
        : `Sample data cleared. Removed ${deleted} demo account(s) and all their courses, enrollments, and related data.`,
  }
}
