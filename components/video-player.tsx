"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, FileText, Download, ChevronLeft, ChevronRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Lesson {
  id: string
  title: string
  description: string | null
  video_url: string | null
  duration_minutes: number | null
  order_index: number
  resources: any[]
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

export function VideoPlayer({ courseId, lessons, initialLessonId, progressData, userId }: VideoPlayerProps) {
  const [currentLessonId, setCurrentLessonId] = useState(initialLessonId)
  const [isCompleted, setIsCompleted] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const currentLesson = lessons.find((l) => l.id === currentLessonId)
  const currentIndex = lessons.findIndex((l) => l.id === currentLessonId)
  const progress = progressData.find((p) => p.lesson_id === currentLessonId)

  useEffect(() => {
    setIsCompleted(progress?.completed || false)
  }, [progress])

  const handleMarkComplete = async () => {
    if (!currentLesson) return

    try {
      // Update or insert progress
      const { error } = await supabase.from("progress").upsert(
        {
          user_id: userId,
          lesson_id: currentLesson.id,
          course_id: courseId,
          completed: true,
          completed_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,lesson_id",
        },
      )

      if (error) throw error

      setIsCompleted(true)

      // Update enrollment progress percentage
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
    if (currentIndex < lessons.length - 1) {
      setCurrentLessonId(lessons[currentIndex + 1].id)
    }
  }

  const handlePreviousLesson = () => {
    if (currentIndex > 0) {
      setCurrentLessonId(lessons[currentIndex - 1].id)
    }
  }

  if (!currentLesson) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-600">No lesson selected</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Video Area */}
      <div className="relative aspect-video bg-black">
        {currentLesson.video_url ? (
          <video
            key={currentLesson.id}
            controls
            className="h-full w-full"
            src={currentLesson.video_url}
            poster="/video-thumbnail.png"
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="flex h-full items-center justify-center text-white">
            <div className="text-center">
              <FileText className="mx-auto mb-4 h-16 w-16 opacity-50" />
              <p>No video available for this lesson</p>
            </div>
          </div>
        )}
      </div>

      {/* Lesson Info */}
      <div className="border-b bg-white p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="secondary">
                Lesson {currentIndex + 1} of {lessons.length}
              </Badge>
              {isCompleted && (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Completed
                </Badge>
              )}
            </div>
            <h2 className="mb-2 text-2xl font-bold">{currentLesson.title}</h2>
            {currentLesson.description && <p className="text-gray-600">{currentLesson.description}</p>}
          </div>
          {!isCompleted && (
            <Button onClick={handleMarkComplete} className="ml-4">
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

      {/* Tabs for Overview and Resources */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-4">
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-4 text-lg font-semibold">About this lesson</h3>
                {currentLesson.description ? (
                  <p className="text-gray-600">{currentLesson.description}</p>
                ) : (
                  <p className="text-gray-500">No description available</p>
                )}
                {currentLesson.duration_minutes && (
                  <div className="mt-4 text-sm text-gray-600">Duration: {currentLesson.duration_minutes} minutes</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="resources" className="mt-4">
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-4 text-lg font-semibold">Downloadable Resources</h3>
                {currentLesson.resources && currentLesson.resources.length > 0 ? (
                  <div className="space-y-2">
                    {currentLesson.resources.map((resource: any, index: number) => (
                      <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-500" />
                          <span className="font-medium">{resource.name || `Resource ${index + 1}`}</span>
                        </div>
                        <Button size="sm" variant="ghost">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No resources available for this lesson</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
