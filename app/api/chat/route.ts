import { createClient } from "@/lib/supabase/server"
import { convertToModelMessages, streamText, type UIMessage } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new Response("Unauthorized", { status: 401 })
  }

  const {
    messages,
    courseId,
    lessonId,
  }: { messages: UIMessage[]; courseId?: string; lessonId?: string } = await req.json()

  // Fetch course and lesson context if provided
  let context = ""
  if (courseId) {
    const { data: course } = await supabase
      .from("courses")
      .select("title, description, lessons(title, description)")
      .eq("id", courseId)
      .single()

    if (course) {
      context += `Course: ${course.title}\n`
      if (course.description) context += `Description: ${course.description}\n`
    }
  }

  if (lessonId) {
    const { data: lesson } = await supabase.from("lessons").select("title, description").eq("id", lessonId).single()

    if (lesson) {
      context += `Current Lesson: ${lesson.title}\n`
      if (lesson.description) context += `Lesson Description: ${lesson.description}\n`
    }
  }

  const systemPrompt = `You are an AI learning assistant for LearnHub, an online learning platform. Your role is to help students understand course material, answer questions, and provide guidance.

${context ? `Context:\n${context}\n` : ""}

Guidelines:
- Be helpful, patient, and encouraging
- Provide clear explanations with examples when appropriate
- If you don't know something, admit it and suggest resources
- Keep responses concise but thorough
- Encourage critical thinking by asking follow-up questions
- Stay focused on educational topics related to the course`

  const result = streamText({
    model: "openai/gpt-4o-mini",
    system: systemPrompt,
    messages: convertToModelMessages(messages),
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse()
}
