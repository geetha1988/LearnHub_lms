import { StaticPage } from "@/components/static-page"

export const metadata = { title: "Cookie Policy | LearnHub" }

export default function CookiesPage() {
  return (
    <StaticPage title="Cookie Policy" subtitle="How and why we use cookies.">
      <p>
        LearnHub uses cookies to keep you signed in, remember your preferences, and understand how the platform is
        used. This is a sample policy for demonstration purposes.
      </p>
      <h2>Essential cookies</h2>
      <p>These are required for authentication and core functionality, such as keeping your session active.</p>
      <h2>Analytics cookies</h2>
      <p>These help us understand usage patterns so we can improve the learning experience.</p>
      <h2>Managing cookies</h2>
      <p>You can control or delete cookies through your browser settings at any time.</p>
    </StaticPage>
  )
}
