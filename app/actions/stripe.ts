"use server"

import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"
import { redirect } from "next/navigation"

export async function startCheckoutSession(courseId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch course details
  const { data: course, error: courseError } = await supabase.from("courses").select("*").eq("id", courseId).single()

  if (courseError || !course) {
    throw new Error("Course not found")
  }

  // Check if already enrolled
  const { data: existingEnrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .single()

  if (existingEnrollment) {
    throw new Error("Already enrolled in this course")
  }

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    ui_mode: "embedded",
    redirect_on_completion: "never",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: course.title,
            description: course.description || undefined,
          },
          unit_amount: course.price_in_cents,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    metadata: {
      course_id: courseId,
      user_id: user.id,
    },
  })

  return session.client_secret
}

export async function handlePaymentSuccess(sessionId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  // Retrieve session from Stripe
  const session = await stripe.checkout.sessions.retrieve(sessionId)

  if (session.payment_status !== "paid") {
    throw new Error("Payment not completed")
  }

  const courseId = session.metadata?.course_id
  const userId = session.metadata?.user_id

  if (!courseId || !userId || userId !== user.id) {
    throw new Error("Invalid session metadata")
  }

  // Fetch course details
  const { data: course } = await supabase.from("courses").select("*").eq("id", courseId).single()

  if (!course) {
    throw new Error("Course not found")
  }

  // Create enrollment
  const { error: enrollmentError } = await supabase.from("enrollments").insert({
    user_id: userId,
    course_id: courseId,
    progress_percentage: 0,
  })

  if (enrollmentError) {
    throw enrollmentError
  }

  // Record payment
  const { error: paymentError } = await supabase.from("payments").insert({
    user_id: userId,
    course_id: courseId,
    amount_in_cents: course.price_in_cents,
    stripe_payment_id: session.payment_intent as string,
    status: "completed",
  })

  if (paymentError) {
    console.error("[v0] Error recording payment:", paymentError)
  }

  return { success: true, courseSlug: course.slug }
}
