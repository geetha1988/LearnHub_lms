import type { ReactNode } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export function StaticPage({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header user={null} />
      <main className="flex-1">
        <section className="border-b bg-gradient-to-br from-indigo-50 via-white to-cyan-50 py-14">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-balance">{title}</h1>
            {subtitle && <p className="mx-auto mt-3 max-w-2xl text-muted-foreground text-pretty">{subtitle}</p>}
          </div>
        </section>
        <section className="container mx-auto max-w-3xl px-4 py-12">
          <div className="prose prose-slate max-w-none leading-relaxed [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_p]:mt-3 [&_p]:text-muted-foreground">
            {children}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
