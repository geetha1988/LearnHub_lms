import { StaticPage } from "@/components/static-page"
import { ContactForm } from "@/components/contact-form"

export const metadata = {
  title: "Contact Us | LearnHub",
  description: "Get in touch with the LearnHub team.",
}

export default function ContactPage() {
  return (
    <StaticPage title="Contact Us" subtitle="Have a question? We'd love to hear from you.">
      <p>Fill out the form below and our team will get back to you as soon as possible.</p>
      <ContactForm />
    </StaticPage>
  )
}
