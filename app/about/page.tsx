import { StaticPage } from "@/components/static-page"

export const metadata = {
  title: "About | LearnHub",
  description: "Learn about LearnHub's mission to make quality education accessible to everyone.",
}

export default function AboutPage() {
  return (
    <StaticPage title="About LearnHub" subtitle="Empowering learners worldwide with quality education.">
      <p>
        LearnHub is an AI-powered learning platform that connects passionate instructors with curious learners around
        the world. Our mission is to make high-quality, practical education accessible to everyone, regardless of
        background or location.
      </p>
      <h2>What we offer</h2>
      <p>
        From web development and data science to design and business, our catalog spans the skills that matter most in
        today&apos;s economy. Every course is built around hands-on projects so you learn by doing.
      </p>
      <h2>AI-powered learning</h2>
      <p>
        Our built-in AI tutor answers your questions in context as you work through lessons, and our recommendation
        engine suggests the right next course based on your goals and progress.
      </p>
      <h2>For instructors</h2>
      <p>
        Instructors can publish courses, track student engagement, and earn revenue through our platform. If you have
        expertise to share, we&apos;d love to have you teach with us.
      </p>
    </StaticPage>
  )
}
