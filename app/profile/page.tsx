import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mail, Calendar, Award, BookOpen } from "lucide-react"
import Link from "next/link"

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Fetch stats
  const { data: enrollments } = await supabase.from("enrollments").select("*").eq("user_id", user.id)

  const { data: completedCourses } = await supabase
    .from("enrollments")
    .select("*")
    .eq("user_id", user.id)
    .eq("progress_percentage", 100)

  const { data: reviews } = await supabase.from("reviews").select("*").eq("user_id", user.id)

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={{ id: user.id, email: user.email ?? "", role: profile?.role ?? "student" }} />

      <main className="flex-1 bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-2xl">
                        {profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <h2 className="mt-4 text-2xl font-bold">{profile?.full_name || "User"}</h2>
                    <Badge className="mt-2" variant="secondary">
                      {profile?.role || "student"}
                    </Badge>
                    <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span>{user.email}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {new Date(profile?.created_at || "").toLocaleDateString()}</span>
                    </div>
                    {profile?.bio && <p className="mt-4 text-sm text-gray-600">{profile.bio}</p>}
                    <Button asChild className="mt-6 w-full bg-transparent" variant="outline">
                      <Link href="/profile/edit">Edit Profile</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Card */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-indigo-600" />
                      <span className="text-sm">Enrolled Courses</span>
                    </div>
                    <span className="font-semibold">{enrollments?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-green-600" />
                      <span className="text-sm">Completed Courses</span>
                    </div>
                    <span className="font-semibold">{completedCourses?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-amber-600" />
                      <span className="text-sm">Reviews Written</span>
                    </div>
                    <span className="font-semibold">{reviews?.length || 0}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  {profile?.bio ? (
                    <p className="text-gray-600">{profile.bio}</p>
                  ) : (
                    <p className="text-gray-500">No bio added yet. Edit your profile to add one.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Learning Journey</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="rounded-lg border p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="font-semibold">Total Courses</h3>
                        <span className="text-2xl font-bold text-indigo-600">{enrollments?.length || 0}</span>
                      </div>
                      <p className="text-sm text-gray-600">Courses you&apos;re currently enrolled in</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="font-semibold">Completed</h3>
                        <span className="text-2xl font-bold text-green-600">{completedCourses?.length || 0}</span>
                      </div>
                      <p className="text-sm text-gray-600">Courses you&apos;ve successfully completed</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="font-semibold">Completion Rate</h3>
                        <span className="text-2xl font-bold text-amber-600">
                          {enrollments && enrollments.length > 0
                            ? Math.round(((completedCourses?.length || 0) / enrollments.length) * 100)
                            : 0}
                          %
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">Percentage of courses completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
