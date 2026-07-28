"use client"

import { useState, useTransition } from "react"
import { resetSampleData } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"

export function AdminResetButton() {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleReset = () => {
    setResult(null)
    startTransition(async () => {
      const res = await resetSampleData()
      setResult(res)
    })
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={isPending}>
            <Trash2 className="mr-2 h-4 w-4" />
            {isPending ? "Resetting..." : "Reset sample data"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all sample data?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the seeded demo instructors and students along with their courses, enrollments,
              reviews, and payments. Your admin account and any real user accounts are kept. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} className="bg-red-600 hover:bg-red-700">
              Yes, reset data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {result && (
        <p className={`text-sm ${result.success ? "text-emerald-600" : "text-red-600"}`}>{result.message}</p>
      )}
    </div>
  )
}
