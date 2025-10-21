import { Suspense } from "react"
import { ResultsPageContent } from "./results-page-content"

export default function ResultsPage() {
  return (
    <Suspense fallback={<ResultsPageLoading />}>
      <ResultsPageContent />
    </Suspense>
  )
}

function ResultsPageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading results...</p>
      </div>
    </div>
  )
}
