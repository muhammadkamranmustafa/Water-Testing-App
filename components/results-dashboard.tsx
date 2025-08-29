"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Droplets,
  Shield,
  Zap,
  Activity,
  Thermometer,
  Sun,
} from "lucide-react"
import type { AnalysisResult } from "@/lib/color-analysis"

interface ResultsDashboardProps {
  results: Record<string, AnalysisResult>
  onViewDetails: () => void
}

const parameterConfig = {
  freeChlorine: {
    name: "Free Chlorine",
    shortName: "Free Cl", // Add short names for mobile
    icon: Shield,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    idealRange: { min: 1.0, max: 3.0 },
    unit: "ppm",
  },
  ph: {
    name: "pH Level",
    shortName: "pH",
    icon: Activity,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    idealRange: { min: 7.2, max: 7.6 },
    unit: "",
  },
  totalAlkalinity: {
    name: "Total Alkalinity",
    shortName: "Alkalinity",
    icon: TrendingUp,
    color: "text-green-600",
    bgColor: "bg-green-50",
    idealRange: { min: 80, max: 120 },
    unit: "ppm",
  },
  totalChlorine: {
    name: "Total Chlorine",
    shortName: "Total Cl",
    icon: Zap,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    idealRange: { min: 1.0, max: 3.0 },
    unit: "ppm",
  },
  totalHardness: {
    name: "Total Hardness",
    shortName: "Hardness",
    icon: Thermometer,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    idealRange: { min: 150, max: 300 },
    unit: "ppm",
  },
  cyanuricAcid: {
    name: "Cyanuric Acid",
    shortName: "CYA",
    icon: Sun,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    idealRange: { min: 30, max: 50 },
    unit: "ppm",
  },
}

function calculateHealthScore(results: Record<string, AnalysisResult>): number {
  const scores = Object.values(results).map((result) => {
    switch (result.status) {
      case "ok":
        return 100
      case "high":
        return 60
      case "low":
        return 40
      default:
        return 0
    }
  })

  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
}

function getHealthScoreColor(score: number): string {
  if (score >= 90) return "text-green-600"
  if (score >= 70) return "text-yellow-600"
  if (score >= 50) return "text-orange-600"
  return "text-red-600"
}

function getHealthScoreBackground(score: number): string {
  if (score >= 90) return "bg-green-50 border-green-200"
  if (score >= 70) return "bg-yellow-50 border-yellow-200"
  if (score >= 50) return "bg-orange-50 border-orange-200"
  return "bg-red-50 border-red-200"
}

function getStatusIcon(status: string, size = "h-5 w-5") {
  switch (status) {
    case "ok":
      return <CheckCircle className={`${size} text-green-500`} />
    case "high":
      return <TrendingUp className={`${size} text-orange-500`} />
    case "low":
      return <TrendingDown className={`${size} text-red-500`} />
    default:
      return <XCircle className={`${size} text-gray-400`} />
  }
}

function getProgressValue(value: number, idealRange: { min: number; max: number }): number {
  const range = idealRange.max - idealRange.min
  const position = (value - idealRange.min) / range
  return Math.max(0, Math.min(100, position * 100))
}

function getProgressColor(status: string): string {
  switch (status) {
    case "ok":
      return "bg-green-500"
    case "high":
      return "bg-orange-500"
    case "low":
      return "bg-red-500"
    default:
      return "bg-gray-400"
  }
}

export function ResultsDashboard({ results, onViewDetails }: ResultsDashboardProps) {
  const healthScore = calculateHealthScore(results)
  const issueCount = Object.values(results).filter((r) => r.status !== "ok").length
  const totalParams = Object.keys(results).length

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className={`${getHealthScoreBackground(healthScore)}`}>
        <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-white rounded-full shadow-sm">
                <Droplets className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg sm:text-2xl font-bold">Pool Health Score</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  {issueCount === 0 ? "All parameters balanced" : `${issueCount} of ${totalParams} need attention`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-3xl sm:text-4xl font-bold ${getHealthScoreColor(healthScore)}`}>{healthScore}</div>
              <div className="text-xs sm:text-sm text-gray-500">out of 100</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {Object.entries(results).map(([key, result]) => {
          const config = parameterConfig[key as keyof typeof parameterConfig]
          if (!config) return null

          const Icon = config.icon
          const progressValue = getProgressValue(result.value, config.idealRange)

          return (
            <Card key={key} className="relative overflow-hidden">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className={`p-1.5 sm:p-2 rounded-lg ${config.bgColor}`}>
                    <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${config.color}`} />
                  </div>
                  {getStatusIcon(result.status, "h-4 w-4 sm:h-5 sm:w-5")}
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <h4 className="font-semibold text-xs sm:text-sm">
                    <span className="sm:hidden">{config.shortName}</span>
                    <span className="hidden sm:inline">{config.name}</span>
                  </h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl sm:text-2xl font-bold">{result.value}</span>
                    <span className="text-xs sm:text-sm text-gray-500">{result.unit}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{config.idealRange.min}</span>
                      <span className="hidden sm:inline">Ideal Range</span>
                      <span className="sm:hidden">Ideal</span>
                      <span>{config.idealRange.max}</span>
                    </div>
                    <div className="relative">
                      <Progress value={100} className="h-1.5 sm:h-2 bg-gray-200" />
                      <div
                        className={`absolute top-0 h-1.5 sm:h-2 rounded-full ${getProgressColor(result.status)}`}
                        style={{ width: `${progressValue}%` }}
                      />
                      <div
                        className="absolute top-0 left-0 h-1.5 sm:h-2 bg-green-200 rounded-full opacity-50"
                        style={{
                          left: "0%",
                          width: "100%",
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <Badge variant={result.status === "ok" ? "default" : "secondary"} className="text-xs px-1.5 py-0.5">
                      {result.status.toUpperCase()}
                    </Badge>
                    <span className="text-gray-500">{Math.round(result.confidence * 100)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
          <CardDescription className="text-sm">
            {issueCount === 0 ? "Your pool water is perfectly balanced!" : "Take action to balance your pool water"}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button onClick={onViewDetails} className="w-full sm:w-auto" size="sm">
              View Detailed Results
            </Button>
            {issueCount > 0 && (
              <Button onClick={onViewDetails} variant="outline" className="w-full sm:w-auto bg-transparent" size="sm">
                Get Chemical Recommendations
              </Button>
            )}
            <div className="flex gap-2 sm:gap-3">
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none bg-transparent">
                Save
              </Button>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none bg-transparent">
                Share
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {issueCount > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
            <div className="flex items-start gap-2 sm:gap-3">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-orange-800 mb-1 text-sm sm:text-base">Action Required</h4>
                <p className="text-xs sm:text-sm text-orange-700 mb-2 sm:mb-3">
                  {issueCount} parameter{issueCount > 1 ? "s" : ""} {issueCount > 1 ? "are" : "is"} outside the ideal
                  range. View detailed results for specific recommendations.
                </p>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {Object.entries(results)
                    .filter(([, result]) => result.status !== "ok")
                    .map(([key, result]) => {
                      const config = parameterConfig[key as keyof typeof parameterConfig]
                      return (
                        <Badge key={key} variant="outline" className="text-orange-700 border-orange-300 text-xs">
                          <span className="sm:hidden">
                            {config?.shortName}: {result.status}
                          </span>
                          <span className="hidden sm:inline">
                            {config?.name}: {result.status}
                          </span>
                        </Badge>
                      )
                    })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
