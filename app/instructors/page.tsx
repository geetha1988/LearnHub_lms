import Link from "next/link"
import { StaticPage } from "@/components/static-page"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Become an Instructor | LearnHub",
  description: "Share your expertise and earn by teaching on LearnHub.",
}

export default function InstructorsPage() {
  return (
    <StaticPage
      title="Become an Instructor"
      subtitle="Share what you know and build an income teaching learners worldwide."
    >
      <p>
        Join LearnHub as an instructor to reach thousands of motivated learners. Create courses at your own pace, build
        your reputation, and earn revenue from every enrollment.
      </p>
      <h2>Why teach with us</h2>
      <p>
        Powerful authoring tools, real-time analytics on student engagement, and a supportive community. You keep
        ownership of your content and get paid for the impact you make.
      </p>
      <h2>Get started</h2>
      <p>Create an account and select the &quot;Instructor&quot; role during sign-up to unlock your teaching dashboard.</p>
      <div className="mt-6 flex gap-3">
        <Button asChild>
          <Link href="/auth/sign-up">Start teaching</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/courses">Browse courses</Link>
        </Button>
      </div>
    </StaticPage>
  )
}
