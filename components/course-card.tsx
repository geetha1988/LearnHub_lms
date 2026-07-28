import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Clock, Star, Users } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface CourseCardProps {
  course: {
    id: string
    title: string
    slug: string
    description: string | null
    thumbnail_url: string | null
    price_in_cents: number
    level: string | null
    duration_minutes: number | null
    instructor?: {
      full_name: string | null
    }
    _count?: {
      enrollments: number
    }
    avg_rating?: number
  }
}

export function CourseCard({ course }: CourseCardProps) {
  const price = course.price_in_cents === 0 ? "Free" : `$${(course.price_in_cents / 100).toFixed(2)}`

  return (
    <Link href={`/courses/${course.slug}`}>
      <Card className="group h-full overflow-hidden transition-all hover:shadow-lg">
        <div className="relative aspect-video overflow-hidden bg-gray-100">
          {course.thumbnail_url ? (
            <Image
              src={course.thumbnail_url || "/placeholder.svg"}
              alt={course.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-indigo-100 to-cyan-100">
              <span className="text-4xl font-bold text-indigo-600">{course.title.charAt(0)}</span>
            </div>
          )}
          {course.level && (
            <Badge className="absolute right-2 top-2 bg-white/90 text-gray-900 hover:bg-white">{course.level}</Badge>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="mb-2 line-clamp-2 text-lg font-semibold leading-tight text-balance">{course.title}</h3>
          {course.description && (
            <p className="mb-3 line-clamp-2 text-sm text-gray-600 text-pretty">{course.description}</p>
          )}
          {course.instructor?.full_name && <p className="text-xs text-gray-500">by {course.instructor.full_name}</p>}
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t p-4">
          <div className="flex items-center gap-4 text-xs text-gray-600">
            {course.avg_rating && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span>{course.avg_rating.toFixed(1)}</span>
              </div>
            )}
            {course._count?.enrollments !== undefined && (
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{course._count.enrollments}</span>
              </div>
            )}
            {course.duration_minutes && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{Math.floor(course.duration_minutes / 60)}h</span>
              </div>
            )}
          </div>
          <span className="font-semibold text-indigo-600">{price}</span>
        </CardFooter>
      </Card>
    </Link>
  )
}
