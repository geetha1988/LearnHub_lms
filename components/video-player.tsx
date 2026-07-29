"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
  Video,
  Music,
  Presentation,
  BookOpen,
  ExternalLink,
  Clock,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { LessonMaterial, MaterialType } from "@/lib/types/database"

interface Lesson {
  id: string
  title: string
  description: string | null
  video_url: string | null
  duration_minutes: number | null
  order_index: number
  resources: any[]
  materials?: LessonMaterial[]
}

interface Progress {
  id: string
  lesson_id: string
  completed: boolean
  last_position_seconds: number
}

interface VideoPlayerProps {
  courseId: string
  lessons: Lesson[]
  initialLessonId: string
  progressData: Progress[]
  userId: string
}

const TYPE_ICON: Record<MaterialType, typeof Video> = {
  video: Video,
  audio: Music,
  pdf: FileText,
  slides: Presentation,
  article: BookOpen,
  download: Download,
}

export function VideoPlayer({ courseId, lessons, initialLessonId, progressData, userId }: VideoPlayerProps) {
  const [currentLessonId, setCurrentLessonId] = useState(initialLessonId)
  const [isCompleted, setIsCompleted] = useState(false)
  const [activeMaterialId, setActiveMaterialId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const currentLesson = lessons.find((l) => l.id === currentLessonId)
  const currentIndex = lessons.findIndex((l) => l.id === currentLessonId)
  const progress = progressData.find((p) => p.lesson_id === currentLessonId)

  // Build the ordered material list for the current lesson. Fall back to the
  // legacy single video_url if a lesson has no structured materials yet.
  const materials = useMemo<LessonMaterial[]>(() => {
    if (!currentLesson) return []
    const list = [...(currentLesson.materials || [])].sort((a, b) => a.order_index - b.order_index)
    if (list.length === 0 && currentLesson.video_url) {
      return [
        {
          id: `legacy-${currentLesson.id}`,
          lesson_id: currentLesson.id,
          type: "video",
          title: currentLesson.title,
          url: currentLesson.video_url,
          content: null,
          file_name: null,
          duration_minutes: currentLesson.duration_minutes,
          order_index: 0,
          created_at: "",
          updated_at: "",
        },
      ]
    }
    return list
  }, [currentLesson])

  useEffect(() => {
    setIsCompleted(progress?.completed || false)
  }, [progress])

  // When the lesson changes, select its first material.
  useEffect(() => {
    setActiveMaterialId(materials[0]?.id ?? null)
  }, [currentLessonId, materials])

  const activeMaterial = materials.find((m) => m.id === activeMaterialId) ?? materials[0] ?? null

  const handleMarkComplete = async () => {
    if (!currentLesson) return
    try {
      const { error } = await supabase.from("progress").upsert(
        {
          user_id: userId,
          lesson_id: currentLesson.id,
          course_id: courseId,
          completed: true,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,lesson_id" },
      )
      if (error) throw error
      setIsCompleted(true)

      const completedCount = progressData.filter((p) => p.completed).length + 1
      const progressPercentage = Math.round((completedCount / lessons.length) * 100)
      await supabase
        .from("enrollments")
        .update({ progress_percentage: progressPercentage })
        .eq("user_id", userId)
        .eq("course_id", courseId)

      router.refresh()
    } catch (error) {
      console.error("[v0] Error marking lesson complete:", error)
    }
  }

  const handleNextLesson = () => {
    if (currentIndex < lessons.length - 1) setCurrentLessonId(lessons[currentIndex + 1].id)
  }
  const handlePreviousLesson = () => {
    if (currentIndex > 0) setCurrentLessonId(lessons[currentIndex - 1].id)
  }

  if (!currentLesson) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No lesson selected</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Stage */}
      <div className="bg-black">
        <MaterialStage material={activeMaterial} lessonTitle={currentLesson.title} />
      </div>

      {/* Material sub-nav */}
      {materials.length > 0 && (
        <div className="flex flex-wrap gap-2 border-b bg-muted/40 p-3">
          {materials.map((m) => {
            const Icon = TYPE_ICON[m.type]
            const active = m.id === activeMaterial?.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveMaterialId(m.id)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-accent"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {m.title}
              </button>
            )
          })}
        </div>
      )}

      {/* Lesson Info */}
      <div className="border-b bg-background p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                Lesson {currentIndex + 1} of {lessons.length}
              </Badge>
              {currentLesson.duration_minutes ? (
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {currentLesson.duration_minutes} min
                </Badge>
              ) : null}
              {isCompleted && (
                <Badge className="gap-1 bg-green-600 text-white hover:bg-green-600">
                  <CheckCircle className="h-3 w-3" />
                  Completed
                </Badge>
              )}
            </div>
            <h2 className="mb-2 text-2xl font-bold text-balance">{currentLesson.title}</h2>
            {currentLesson.description && <p className="text-muted-foreground">{currentLesson.description}</p>}
          </div>
          {!isCompleted && (
            <Button onClick={handleMarkComplete} className="ml-4 shrink-0">
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark as Complete
            </Button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button onClick={handlePreviousLesson} disabled={currentIndex === 0} variant="outline">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          <Button onClick={handleNextLesson} disabled={currentIndex === lessons.length - 1} variant="outline">
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Downloads for the current lesson (all download-type materials) */}
      <div className="flex-1 overflow-y-auto bg-muted/30 p-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Lesson Resources</h3>
            {materials.filter((m) => m.type === "download").length > 0 ? (
              <div className="space-y-2">
                {materials
                  .filter((m) => m.type === "download")
                  .map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{m.file_name || m.title}</span>
                      </div>
                      {m.url && (
                        <Button asChild size="sm" variant="ghost">
                          <a href={m.url} target="_blank" rel="noopener noreferrer" download>
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Download {m.file_name || m.title}</span>
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No downloadable resources for this lesson.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MaterialStage({ material, lessonTitle }: { material: LessonMaterial | null; lessonTitle: string }) {
  if (!material) {
    return (
      <div className="flex aspect-video items-center justify-center text-white">
        <div className="text-center">
          <FileText className="mx-auto mb-4 h-16 w-16 opacity-50" />
          <p>No material available for this lesson yet.</p>
        </div>
      </div>
    )
  }

  switch (material.type) {
    case "video":
      return (
        <video key={material.id} controls className="aspect-video h-full w-full" src={material.url ?? undefined} poster="/video-thumbnail.png">
          Your browser does not support the video tag.
        </video>
      )

    case "audio":
      return (
        <div className="flex aspect-video flex-col items-center justify-center gap-6 bg-gradient-to-b from-neutral-800 to-black p-6 text-white">
          <Music className="h-20 w-20 opacity-80" />
          <p className="text-lg font-medium text-balance text-center">{material.title}</p>
          <audio key={material.id} controls className="w-full max-w-xl" src={material.url ?? undefined}>
            Your browser does not support the audio element.
          </audio>
        </div>
      )

    case "pdf":
      return (
        <div className="flex aspect-video flex-col bg-white">
          <iframe key={material.id} src={material.url ?? ""} title={material.title} className="h-full w-full flex-1" />
          <div className="flex items-center justify-end gap-2 border-t bg-muted/40 p-2">
            <Button asChild size="sm" variant="outline">
              <a href={material.url ?? "#"} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open
              </a>
            </Button>
            <Button asChild size="sm" variant="outline">
              <a href={material.url ?? "#"} target="_blank" rel="noopener noreferrer" download>
                <Download className="mr-2 h-4 w-4" />
                Download
              </a>
            </Button>
          </div>
        </div>
      )

    case "slides":
      return (
        <iframe
          key={material.id}
          src={`https://docs.google.com/gview?url=${encodeURIComponent(material.url ?? "")}&embedded=true`}
          title={material.title}
          className="aspect-video h-full w-full bg-white"
        />
      )

    case "article":
      return (
        <div className="aspect-video overflow-y-auto bg-background">
          <article className="mx-auto max-w-3xl p-8">
            <h3 className="mb-4 text-xl font-bold">{material.title}</h3>
            <div className="whitespace-pre-wrap leading-relaxed text-foreground/90">
              {material.content || "No content provided."}
            </div>
          </article>
        </div>
      )

    case "download":
      return (
        <div className="flex aspect-video flex-col items-center justify-center gap-4 bg-gradient-to-b from-neutral-800 to-black p-6 text-white">
          <Download className="h-16 w-16 opacity-80" />
          <p className="text-lg font-medium">{material.file_name || material.title}</p>
          {material.url && (
            <Button asChild variant="secondary">
              <a href={material.url} target="_blank" rel="noopener noreferrer" download>
                <Download className="mr-2 h-4 w-4" />
                Download file
              </a>
            </Button>
          )}
        </div>
      )

    default:
      return (
        <div className="flex aspect-video items-center justify-center text-white">
          <p>Unsupported material type.</p>
        </div>
      )
  }
}
