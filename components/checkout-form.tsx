"use client"

import { useCallback, useState } from "react"
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { startCheckoutSession, handlePaymentSuccess } from "@/app/actions/stripe"
import { useRouter } from "next/navigation"
import { CheckCircle } from "lucide-react"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export function CheckoutForm({ courseId }: { courseId: string }) {
  const [isComplete, setIsComplete] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const fetchClientSecret = useCallback(() => startCheckoutSession(courseId), [courseId])

  const handleComplete = async () => {
    setIsProcessing(true)
    setError(null)

    try {
      // Get the session ID from the URL
      const urlParams = new URLSearchParams(window.location.search)
      const sessionId = urlParams.get("session_id")

      if (!sessionId) {
        throw new Error("No session ID found")
      }

      const result = await handlePaymentSuccess(sessionId)

      if (result.success) {
        setIsComplete(true)
        setTimeout(() => {
          router.push(`/learn/${result.courseSlug}`)
        }, 2000)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h3 className="mb-2 text-xl font-semibold">Payment Successful!</h3>
        <p className="text-gray-600">Redirecting to your course...</p>
      </div>
    )
  }

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret, onComplete: handleComplete }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
      {isProcessing && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">Processing your enrollment...</p>
        </div>
      )}
      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
    </div>
  )
}
