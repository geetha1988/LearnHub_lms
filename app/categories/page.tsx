import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Code, LineChart, Smartphone, Palette, Briefcase, BookOpen } from "lucide-react"

export const dynamic = "force-dynamic"

const ICONS: Record<string, typeof Code> = {
  "web-development": Code,
  "data-science": LineChart,
  "mobile-development": Smartphone,
  design: Palette,
  business: Briefcase,
}

export default async function CategoriesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let headerUser = null
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    headerUser = { id: user.id, email: user.email ?? "", role: profile?.role ?? "student" }
  }

  const { data: categories } = await supabase.from("categories").select("*").order("name")

  // Count published courses per category.
  const { data: courses } = await supabase.from("courses").select("category_id").eq("is_published", true)
  const counts = (courses ?? []).reduce<Record<string, number>>((acc, c) => {
    if (c.category_id) acc[c.category_id] = (acc[c.category_id] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={headerUser} />
      <main className="flex-1">
        <section className="border-b bg-gradient-to-br from-indigo-50 via-white to-cyan-50 py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-balance">Explore Categories</h1>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground text-pretty">
              Browse our full catalog of courses organized by topic and find the perfect path for your goals.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          {!categories || categories.length === 0 ? (
            <p className="text-center text-muted-foreground">No categories available yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => {
                const Icon = ICONS[category.slug] ?? BookOpen
                return (
                  <Link key={category.id} href={`/courses?category=${category.slug}`}>
                    <Card className="h-full transition-shadow hover:shadow-lg">
                      <CardContent className="flex flex-col gap-3 p-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
                          <Icon className="h-6 w-6 text-indigo-600" />
                        </div>
                        <h2 className="text-lg font-semibold">{category.name}</h2>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                        <p className="mt-auto text-sm font-medium text-indigo-600">
                          {counts[category.id] ?? 0} course{(counts[category.id] ?? 0) === 1 ? "" : "s"}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}
