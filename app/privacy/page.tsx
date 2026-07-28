import { StaticPage } from "@/components/static-page"

export const metadata = { title: "Privacy Policy | LearnHub" }

export default function PrivacyPage() {
  return (
    <StaticPage title="Privacy Policy" subtitle="How we collect, use, and protect your data.">
      <p>
        This Privacy Policy describes how LearnHub collects and uses your information when you use our platform. This is
        a sample policy for demonstration purposes.
      </p>
      <h2>Information we collect</h2>
      <p>
        We collect the information you provide when creating an account (such as your name and email) and data about
        your learning activity, including enrollments and lesson progress.
      </p>
      <h2>How we use your information</h2>
      <p>
        We use your information to operate the platform, personalize recommendations, process payments, and improve our
        services.
      </p>
      <h2>Data security</h2>
      <p>
        We apply industry-standard safeguards, including row-level security and encrypted authentication, to protect
        your data.
      </p>
    </StaticPage>
  )
}
