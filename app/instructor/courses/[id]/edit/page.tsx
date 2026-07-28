"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { use } from "react"

export default function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [course, setCourse] = useState<any>(null)
  const [lessons, setLessons] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadCourse()
  }, [id])

  const loadCourse = async () => {
    try {
      const { data: courseData, error: courseError } = await supabase.from("courses").select("*").eq("id", id).single()

      if (courseError) throw courseError

      const { data: lessonsData } = await supabase.from("lessons").select("*").eq("course_id", id).order("order_index")

      setCourse(courseData)
      setLessons(lessonsData || [])
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveCourse = async () => {
    setIsSaving(true)
    setError(null)

    try {
      const { error } = await supabase.from("courses").update(course).eq("id", id)

      if (error) throw error

      router.refresh()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddLesson = async () => {
    try {
      const { data, error } = await supabase
        .from("lessons")
        .insert({
          course_id: id,
          title: "New Lesson",
          order_index: lessons.length,
        })
        .select()
        .single()

      if (error) throw error

      setLessons([...lessons, data])
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      const { error } = await supabase.from("lessons").delete().eq("id", lessonId)

      if (error) throw error

      setLessons(lessons.filter((l) => l.id !== lessonId))
    } catch (error: any) {
      setError(error.message)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Course not found</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={null} />

      <main className="flex-1 bg-gray-50 py-12">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="mb-6 flex items-center justify-between">
            <Button asChild variant="ghost">
              <Link href="/instructor/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            <Button onClick={handleSaveCourse} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          <Tabs defaultValue="details" className="w-full">
            <TabsList>
              <TabsTrigger value="details">Course Details</TabsTrigger>
              <TabsTrigger value="lessons">Lessons</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Course Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Course Title</Label>
                    <Input
                      id="title"
                      value={course.title}
                      onChange={(e) => setCourse({ ...course, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      rows={5}
                      value={course.description || ""}
                      onChange={(e) => setCourse({ ...course, description: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="level">Level</Label>
                      <Select
                        value={course.level || ""}
                        onValueChange={(value) => setCourse({ ...course, level: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price">Price (USD)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={(course.price_in_cents / 100).toFixed(2)}
                        onChange={(e) =>
                          setCourse({ ...course, price_in_cents: Math.round(Number.parseFloat(e.target.value) * 100) })
                        }
                      />
                    </div>
                  </div>

                  {error && <p className="text-sm text-red-500">{error}</p>}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="lessons" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Course Lessons</CardTitle>
                    <Button onClick={handleAddLesson} size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Lesson
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {lessons.length > 0 ? (
                    <div className="space-y-2">
                      {lessons.map((lesson, index) => (
                        <div key={lesson.id} className="flex items-center justify-between rounded-lg border p-4">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                            <span className="font-medium">{lesson.title}</span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteLesson(lesson.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-gray-600">
                      <p>No lessons yet. Click "Add Lesson" to get started.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Course Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="published">Publish Course</Label>
                      <p className="text-sm text-gray-600">Make this course visible to students</p>
                    </div>
                    <Switch
                      id="published"
                      checked={course.is_published}
                      onCheckedChange={(checked) => setCourse({ ...course, is_published: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  )
}
