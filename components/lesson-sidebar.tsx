"use client"

import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CheckCircle, Circle, PlayCircle, Lock } from "lucide-react"
import { cn } from "@/lib/utils"

interface Lesson {
  id: string
  title: string
  duration_minutes: number | null
  order_index: number
  is_free: boolean
}

interface Progress {
  lesson_id: string
  completed: boolean
}

interface LessonSidebarProps {
  lessons: Lesson[]
  courseId: string
  progressData: Progress[]
  currentLessonId: string
  onSelectLesson: (lessonId: string) => void
}

export function LessonSidebar({ lessons, progressData, currentLessonId, onSelectLesson }: LessonSidebarProps) {
  return (
    <div className="w-80 border-l bg-white">
      <div className="border-b p-4">
        <h2 className="font-semibold">Course Content</h2>
        <p className="text-xs text-gray-600">
          {progressData.filter((p) => p.completed).length} / {lessons.length} lessons completed
        </p>
      </div>
      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="p-2">
          {lessons.map((lesson, index) => {
            const progress = progressData.find((p) => p.lesson_id === lesson.id)
            const isCompleted = progress?.completed || false
            const isCurrent = lesson.id === currentLessonId

            return (
              <Card
                key={lesson.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectLesson(lesson.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onSelectLesson(lesson.id)
                  }
                }}
                className={cn(
                  "mb-2 cursor-pointer transition-all hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
                  isCurrent && "border-indigo-600 bg-indigo-50",
                )}
              >
                <div className="flex items-start gap-3 p-3">
                  <div className="flex-shrink-0 pt-1">
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : isCurrent ? (
                      <PlayCircle className="h-5 w-5 text-indigo-600" />
                    ) : lesson.is_free ? (
                      <Circle className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Lock className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 text-xs font-medium text-gray-500">Lesson {index + 1}</div>
                    <h3
                      className={cn(
                        "mb-1 text-sm font-medium leading-tight",
                        isCurrent ? "text-indigo-600" : "text-gray-900",
                      )}
                    >
                      {lesson.title}
                    </h3>
                    {lesson.duration_minutes && <p className="text-xs text-gray-500">{lesson.duration_minutes} min</p>}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
