"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Lesson, LessonMaterial, MaterialType } from "@/lib/types/database"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  Video,
  Music,
  FileText,
  Presentation,
  BookOpen,
  Download,
  Save,
  Loader2,
} from "lucide-react"

const MATERIAL_META: Record<MaterialType, { label: string; icon: typeof Video }> = {
  video: { label: "Video", icon: Video },
  audio: { label: "Audio", icon: Music },
  pdf: { label: "PDF", icon: FileText },
  slides: { label: "Slides", icon: Presentation },
  article: { label: "Article", icon: BookOpen },
  download: { label: "Download", icon: Download },
}

const MATERIAL_ORDER: MaterialType[] = ["video", "audio", "pdf", "slides", "article", "download"]

type LessonWithMaterials = Lesson & { materials: LessonMaterial[] }

interface LessonManagerProps {
  courseId: string
  initialLessons: LessonWithMaterials[]
}

export function LessonManager({ courseId, initialLessons }: LessonManagerProps) {
  const supabase = createClient()
  const [lessons, setLessons] = useState<LessonWithMaterials[]>(
    initialLessons.map((l) => ({ ...l, materials: [...(l.materials || [])].sort(byOrder) })),
  )
  const [openLessonId, setOpenLessonId] = useState<string | null>(initialLessons[0]?.id ?? null)
  const [savingLessonId, setSavingLessonId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function updateLessonState(lessonId: string, patch: Partial<LessonWithMaterials>) {
    setLessons((prev) => prev.map((l) => (l.id === lessonId ? { ...l, ...patch } : l)))
  }

  function updateMaterialState(lessonId: string, materialId: string, patch: Partial<LessonMaterial>) {
    setLessons((prev) =>
      prev.map((l) =>
        l.id === lessonId
          ? { ...l, materials: l.materials.map((m) => (m.id === materialId ? { ...m, ...patch } : m)) }
          : l,
      ),
    )
  }

  async function handleAddLesson() {
    setError(null)
    const { data, error } = await supabase
      .from("lessons")
      .insert({ course_id: courseId, title: "New Lesson", order_index: lessons.length })
      .select()
      .single()
    if (error) return setError(error.message)
    setLessons((prev) => [...prev, { ...(data as Lesson), materials: [] }])
    setOpenLessonId(data.id)
  }

  async function handleDeleteLesson(lessonId: string) {
    setError(null)
    const { error } = await supabase.from("lessons").delete().eq("id", lessonId)
    if (error) return setError(error.message)
    setLessons((prev) => prev.filter((l) => l.id !== lessonId))
  }

  async function handleMoveLesson(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= lessons.length) return
    const reordered = [...lessons]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    setLessons(reordered)
    setError(null)
    // Persist new order_index for the two swapped lessons
    await Promise.all(
      reordered.map((l, i) =>
        l.order_index !== i
          ? supabase.from("lessons").update({ order_index: i }).eq("id", l.id)
          : Promise.resolve(),
      ),
    )
    setLessons((prev) => prev.map((l, i) => ({ ...l, order_index: i })))
  }

  async function handleSaveLesson(lesson: LessonWithMaterials) {
    setSavingLessonId(lesson.id)
    setError(null)
    try {
      const { error: lessonError } = await supabase
        .from("lessons")
        .update({
          title: lesson.title,
          description: lesson.description,
          duration_minutes: lesson.duration_minutes,
          is_free: lesson.is_free,
        })
        .eq("id", lesson.id)
      if (lessonError) throw lessonError

      if (lesson.materials.length > 0) {
        const { error: matError } = await supabase.from("lesson_materials").upsert(
          lesson.materials.map((m, i) => ({
            id: m.id,
            lesson_id: lesson.id,
            type: m.type,
            title: m.title,
            url: m.url,
            content: m.content,
            file_name: m.file_name,
            duration_minutes: m.duration_minutes,
            order_index: i,
          })),
        )
        if (matError) throw matError
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSavingLessonId(null)
    }
  }

  async function handleAddMaterial(lessonId: string, type: MaterialType) {
    setError(null)
    const lesson = lessons.find((l) => l.id === lessonId)
    if (!lesson) return
    const { data, error } = await supabase
      .from("lesson_materials")
      .insert({
        lesson_id: lessonId,
        type,
        title: `New ${MATERIAL_META[type].label}`,
        order_index: lesson.materials.length,
      })
      .select()
      .single()
    if (error) return setError(error.message)
    updateLessonState(lessonId, { materials: [...lesson.materials, data as LessonMaterial] })
  }

  async function handleDeleteMaterial(lessonId: string, materialId: string) {
    setError(null)
    const { error } = await supabase.from("lesson_materials").delete().eq("id", materialId)
    if (error) return setError(error.message)
    const lesson = lessons.find((l) => l.id === lessonId)
    if (!lesson) return
    updateLessonState(lessonId, { materials: lesson.materials.filter((m) => m.id !== materialId) })
  }

  function handleMoveMaterial(lessonId: string, index: number, direction: -1 | 1) {
    const lesson = lessons.find((l) => l.id === lessonId)
    if (!lesson) return
    const target = index + direction
    if (target < 0 || target >= lesson.materials.length) return
    const reordered = [...lesson.materials]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    updateLessonState(lessonId, { materials: reordered })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Course Lessons</h3>
          <p className="text-sm text-muted-foreground">
            Add lessons and attach multiple materials (video, audio, PDF, slides, articles, downloads).
          </p>
        </div>
        <Button onClick={handleAddLesson} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Lesson
        </Button>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {lessons.length === 0 && (
        <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
          <p>No lessons yet. Click &quot;Add Lesson&quot; to get started.</p>
        </div>
      )}

      {lessons.map((lesson, index) => {
        const isOpen = openLessonId === lesson.id
        return (
          <Card key={lesson.id}>
            <div className="flex items-center gap-3 p-4">
              <div className="flex flex-col">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleMoveLesson(index, -1)}
                  disabled={index === 0}
                  aria-label="Move lesson up"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleMoveLesson(index, 1)}
                  disabled={index === lessons.length - 1}
                  aria-label="Move lesson down"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              <button
                type="button"
                className="flex flex-1 items-center gap-3 text-left"
                onClick={() => setOpenLessonId(isOpen ? null : lesson.id)}
              >
                <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                <span className="font-medium">{lesson.title || "Untitled lesson"}</span>
                {lesson.is_free && <Badge variant="secondary">Free preview</Badge>}
                <Badge variant="outline">
                  {lesson.materials.length} material{lesson.materials.length === 1 ? "" : "s"}
                </Badge>
              </button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteLesson(lesson.id)}
                aria-label="Delete lesson"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>

            {isOpen && (
              <CardContent className="space-y-6 border-t pt-6">
                {/* Lesson fields */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Lesson Title</Label>
                    <Input
                      value={lesson.title}
                      onChange={(e) => updateLessonState(lesson.id, { title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Description</Label>
                    <Textarea
                      rows={2}
                      value={lesson.description || ""}
                      onChange={(e) => updateLessonState(lesson.id, { description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={lesson.duration_minutes ?? ""}
                      onChange={(e) =>
                        updateLessonState(lesson.id, {
                          duration_minutes: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <Switch
                      id={`free-${lesson.id}`}
                      checked={lesson.is_free}
                      onCheckedChange={(checked) => updateLessonState(lesson.id, { is_free: checked })}
                    />
                    <Label htmlFor={`free-${lesson.id}`}>Free preview lesson</Label>
                  </div>
                </div>

                {/* Materials */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Materials</h4>
                  </div>

                  {lesson.materials.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No materials yet. Add one below so students have something to learn from.
                    </p>
                  )}

                  {lesson.materials.map((material, mIndex) => {
                    const Icon = MATERIAL_META[material.type].icon
                    return (
                      <div key={material.id} className="rounded-lg border p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{MATERIAL_META[material.type].label}</span>
                          <div className="ml-auto flex items-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleMoveMaterial(lesson.id, mIndex, -1)}
                              disabled={mIndex === 0}
                              aria-label="Move material up"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleMoveMaterial(lesson.id, mIndex, 1)}
                              disabled={mIndex === lesson.materials.length - 1}
                              aria-label="Move material down"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleDeleteMaterial(lesson.id, material.id)}
                              aria-label="Delete material"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Type</Label>
                            <Select
                              value={material.type}
                              onValueChange={(value) =>
                                updateMaterialState(lesson.id, material.id, { type: value as MaterialType })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {MATERIAL_ORDER.map((t) => (
                                  <SelectItem key={t} value={t}>
                                    {MATERIAL_META[t].label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                              value={material.title}
                              onChange={(e) =>
                                updateMaterialState(lesson.id, material.id, { title: e.target.value })
                              }
                            />
                          </div>

                          {material.type === "article" ? (
                            <div className="space-y-2 md:col-span-2">
                              <Label>Article content</Label>
                              <Textarea
                                rows={5}
                                placeholder="Write the lesson text students will read..."
                                value={material.content || ""}
                                onChange={(e) =>
                                  updateMaterialState(lesson.id, material.id, { content: e.target.value })
                                }
                              />
                            </div>
                          ) : (
                            <div className="space-y-2 md:col-span-2">
                              <Label>
                                {material.type === "download" ? "File URL" : "Media URL"}
                              </Label>
                              <Input
                                placeholder="https://..."
                                value={material.url || ""}
                                onChange={(e) =>
                                  updateMaterialState(lesson.id, material.id, { url: e.target.value })
                                }
                              />
                            </div>
                          )}

                          {material.type === "download" && (
                            <div className="space-y-2">
                              <Label>File name</Label>
                              <Input
                                placeholder="worksheet.pdf"
                                value={material.file_name || ""}
                                onChange={(e) =>
                                  updateMaterialState(lesson.id, material.id, { file_name: e.target.value })
                                }
                              />
                            </div>
                          )}

                          {(material.type === "video" || material.type === "audio") && (
                            <div className="space-y-2">
                              <Label>Duration (minutes)</Label>
                              <Input
                                type="number"
                                min={0}
                                value={material.duration_minutes ?? ""}
                                onChange={(e) =>
                                  updateMaterialState(lesson.id, material.id, {
                                    duration_minutes: e.target.value === "" ? null : Number(e.target.value),
                                  })
                                }
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {/* Add material by type */}
                  <div className="flex flex-wrap gap-2">
                    {MATERIAL_ORDER.map((t) => {
                      const Icon = MATERIAL_META[t].icon
                      return (
                        <Button
                          key={t}
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddMaterial(lesson.id, t)}
                        >
                          <Icon className="mr-2 h-4 w-4" />
                          {MATERIAL_META[t].label}
                        </Button>
                      )
                    })}
                  </div>
                </div>

                <div className="flex justify-end border-t pt-4">
                  <Button onClick={() => handleSaveLesson(lesson)} disabled={savingLessonId === lesson.id}>
                    {savingLessonId === lesson.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Lesson
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}

function byOrder(a: LessonMaterial, b: LessonMaterial) {
  return a.order_index - b.order_index
}
