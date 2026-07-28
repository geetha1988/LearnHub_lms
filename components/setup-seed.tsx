"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { seedSampleData } from "@/app/actions/admin"
import { CheckCircle2, AlertCircle, Loader2, Database } from "lucide-react"

export function SetupSeed({ alreadySeeded }: { alreadySeeded: boolean }) {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  async function handleSeed() {
    setIsLoading(true)
    setResult(null)
    try {
      const res = await seedSampleData()
      setResult(res)
    } catch (error) {
      setResult({ success: false, message: error instanceof Error ? error.message : "Something went wrong" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button onClick={handleSeed} disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 sm:w-auto">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating sample data...
          </>
        ) : (
          <>
            <Database className="mr-2 h-4 w-4" />
            {alreadySeeded ? "Re-run sample data seed" : "Create sample data"}
          </>
        )}
      </Button>

      {alreadySeeded && !result && (
        <p className="text-xs text-muted-foreground">
          An admin account already exists. Re-running requires being logged in as an admin.
        </p>
      )}

      {result && (
        <div
          className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
            result.success
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {result.success ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{result.message}</span>
        </div>
      )}
    </div>
  )
}
