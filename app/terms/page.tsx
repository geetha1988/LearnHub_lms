import { StaticPage } from "@/components/static-page"

export const metadata = { title: "Terms of Service | LearnHub" }

export default function TermsPage() {
  return (
    <StaticPage title="Terms of Service" subtitle="The rules for using the LearnHub platform.">
      <p>
        By accessing or using LearnHub, you agree to these Terms of Service. This is a sample document for demonstration
        purposes.
      </p>
      <h2>Using the platform</h2>
      <p>
        You agree to use LearnHub only for lawful purposes and to respect the intellectual property of instructors and
        other users.
      </p>
      <h2>Accounts</h2>
      <p>
        You are responsible for maintaining the confidentiality of your account credentials and for all activity under
        your account.
      </p>
      <h2>Purchases</h2>
      <p>
        Paid courses are billed at the listed price at the time of purchase. Refund eligibility is handled on a
        case-by-case basis.
      </p>
    </StaticPage>
  )
}
