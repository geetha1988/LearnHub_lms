import Link from "next/link"
import { StaticPage } from "@/components/static-page"

export const metadata = { title: "Help Center | LearnHub" }

export default function HelpPage() {
  return (
    <StaticPage title="Help Center" subtitle="Answers to common questions and ways to get support.">
      <h2>Getting started</h2>
      <p>
        Create an account, browse the <Link href="/courses" className="text-indigo-600 underline">course catalog</Link>,
        and enroll in any course. Free courses grant instant access; paid courses unlock after checkout.
      </p>
      <h2>Managing your learning</h2>
      <p>
        Track progress from your dashboard, resume lessons where you left off, and mark lessons complete as you go.
      </p>
      <h2>Still need help?</h2>
      <p>
        Visit our <Link href="/faq" className="text-indigo-600 underline">FAQ</Link> or{" "}
        <Link href="/contact" className="text-indigo-600 underline">contact us</Link> and we&apos;ll be happy to assist.
      </p>
    </StaticPage>
  )
}
