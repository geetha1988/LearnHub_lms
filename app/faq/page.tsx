import { StaticPage } from "@/components/static-page"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export const metadata = { title: "FAQ | LearnHub" }

const FAQS = [
  {
    q: "How do I enroll in a course?",
    a: "Open any course page and click Enroll. Free courses grant instant access; paid courses take you through secure Stripe checkout.",
  },
  {
    q: "Do I get lifetime access?",
    a: "Yes. Once you enroll in a course, you have unlimited access to its lessons and any future updates.",
  },
  {
    q: "Can I become an instructor?",
    a: "Absolutely. Select the Instructor role when signing up to unlock the teaching dashboard where you can create and publish courses.",
  },
  {
    q: "Is there an AI tutor?",
    a: "Yes. While viewing a lesson, the AI tutor can answer questions in the context of the course and lesson you're studying.",
  },
  {
    q: "What payment methods are accepted?",
    a: "We process payments securely through Stripe, which supports major credit and debit cards.",
  },
]

export default function FaqPage() {
  return (
    <StaticPage title="Frequently Asked Questions" subtitle="Quick answers to the things learners ask most.">
      <div className="not-prose">
        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </StaticPage>
  )
}
