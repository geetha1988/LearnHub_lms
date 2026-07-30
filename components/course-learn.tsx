"use client"

import { useState } from "react"
import { VideoPlayer } from "@/components/video-player"
import { LessonSidebar } from "@/components/lesson-sidebar"
import { AIChat } from "@/components/ai-chat"
import type { LessonMaterial } from "@/lib/types/database"

interface Lesson {
  id: string
  title: string
  description: string | null
  video_url: string | null
  duration_minutes: number | null
  order_index: number
  is_free: boolean
  resources: any[]
  materials?: LessonMaterial[]
}

interface Progress {
  id: string
  lesson_id: string
  completed: boolean
  last_position_seconds: number
}

interface CourseLearnProps {
  courseId: string
  lessons: Lesson[]
  initialLessonId: string
  progressData: Progress[]
  userId: string
}

export function CourseLearn({ courseId, lessons, initialLessonId, progressData, userId }: CourseLearnProps) {
  const [currentLessonId, setCurrentLessonId] = useState(initialLessonId)

  return (
    <>
      <div className="flex flex-1 overflow-hidden">
        {/* Video Player Area */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          <VideoPlayer
            courseId={courseId}
            lessons={lessons}
            currentLessonId={currentLessonId}
            onLessonChange={setCurrentLessonId}
            progressData={progressData}
            userId={userId}
          />
        </div>

        {/* Lesson Sidebar */}
        <LessonSidebar
          lessons={lessons}
          courseId={courseId}
          progressData={progressData}
          currentLessonId={currentLessonId}
          onSelectLesson={setCurrentLessonId}
        />
      </div>

      {/* AI Chat Assistant */}
      <AIChat courseId={courseId} lessonId={currentLessonId} />
    </>
  )
}
