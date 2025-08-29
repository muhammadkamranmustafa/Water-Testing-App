"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Target, CheckCircle, AlertCircle } from "lucide-react"
import type { AnalysisResult, RGB } from "@/lib/color-analysis"
import type { ColorCluster } from "@/lib/advanced-color-analysis"

interface ColorAnalysisDebugProps {
  imageUrl: string
  results: Record<string, AnalysisResult & { detectedColor?: RGB; clusters?: ColorCluster[] }>
}

export function ColorAnalysisDebug({ imageUrl, results }: ColorAnalysisDebugProps) {
  const [showDebug, setShowDebug] = useState(false)

  if (!showDebug) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <Button onClick={() => setShowDebug(true)} variant="outline" size="sm" className="w-full">
            <Eye className="h-4 w-4 mr-2" />
            Show Color Analysis Debug
          </Button>
        </CardContent>
      </Card>
    )
  }

  const parameterDisplayNames: Record<string, string> = {
    freeChlorine: "Free Chlorine",
    ph: "pH",
    totalAlkalinity: "Total Alkalinity",
    totalChlorine: "Total Chlorine",
    totalHardness: "Total Hardness",
    cyanuricAcid: "Cyanuric Acid",
  }

  // Calculate analysis quality metrics
  const highConfidenceCount = Object.values(results).filter((r) => r.confidence > 0.7).length
  const mediumConfidenceCount = Object.values(results).filter((r) => r.confidence >= 0.5 && r.confidence <= 0.7).length
  const lowConfidenceCount = Object.values(results).filter((r) => r.confidence < 0.5).length
  const averageConfidence =
    Object.values(results).reduce((sum, r) => sum + r.confidence, 0) / Object.values(results).length

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-orange-800 flex items-center gap-2">
            <Target className="h-5 w-5" />
            Enhanced Color Analysis Debug
          </CardTitle>
          <Button onClick={() => setShowDebug(false)} variant="ghost" size="sm">
            <EyeOff className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-orange-700">
            This debug panel shows how the enhanced color analysis system processed your test strip using advanced strip
            detection and background isolation techniques.
          </div>

          {/* Enhanced Processing Method Info */}
          <div className="p-3 bg-white rounded-lg border">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Advanced HSV Color Analysis
            </h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div>✓ HSV color space analysis (more perceptually accurate)</div>
              <div>✓ Advanced color clustering with saturation weighting</div>
              <div>✓ Intelligent background and shadow filtering</div>
              <div>✓ Hue-based color grouping for better accuracy</div>
              <div>✓ Multi-cluster analysis for confidence scoring</div>
              <div>✓ Perceptual color distance calculations</div>
              <div>✓ Enhanced interpolation between color matches</div>
            </div>
          </div>

          {/* Overall Analysis Quality */}
          <div className="p-3 bg-white rounded-lg border">
            <h4 className="font-medium text-sm mb-2">Overall Analysis Quality</h4>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${averageConfidence * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium">{Math.round(averageConfidence * 100)}%</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="font-medium text-green-600">{highConfidenceCount}</div>
                <div className="text-gray-500">High (70%+)</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-yellow-600">{mediumConfidenceCount}</div>
                <div className="text-gray-500">Medium (50-70%)</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-red-600">{lowConfidenceCount}</div>
                <div className="text-gray-500">Low (&lt;50%)</div>
              </div>
            </div>
          </div>

          {/* Enhanced Detected Colors with Clusters */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Advanced Color Analysis Results</h4>
            {Object.entries(results).map(([parameter, result]) => (
              <div key={parameter} className="p-3 bg-white rounded border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{parameterDisplayNames[parameter] || parameter}</span>
                  <div className="flex items-center gap-2">
                    {result.detectedColor && (
                      <div
                        className="w-8 h-8 rounded-lg border-2 border-gray-300 shadow-sm"
                        style={{
                          backgroundColor: `rgb(${result.detectedColor.r}, ${result.detectedColor.g}, ${result.detectedColor.b})`,
                        }}
                        title={`RGB(${result.detectedColor.r}, ${result.detectedColor.g}, ${result.detectedColor.b})`}
                      />
                    )}
                    {/* Show additional color clusters if available */}
                    {result.clusters && result.clusters.length > 1 && (
                      <div className="flex gap-1">
                        {result.clusters.slice(1, 3).map((cluster, idx) => (
                          <div
                            key={idx}
                            className="w-4 h-4 rounded border border-gray-300"
                            style={{
                              backgroundColor: `rgb(${cluster.color.r}, ${cluster.color.g}, ${cluster.color.b})`,
                            }}
                            title={`Alt color ${idx + 1}: RGB(${cluster.color.r}, ${cluster.color.g}, ${cluster.color.b})`}
                          />
                        ))}
                      </div>
                    )}
                    <Badge
                      variant={
                        result.confidence > 0.7 ? "default" : result.confidence > 0.5 ? "secondary" : "destructive"
                      }
                      className="text-xs"
                    >
                      {Math.round(result.confidence * 100)}% confidence
                    </Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div className="text-gray-500">
                    {result.detectedColor
                      ? `RGB(${result.detectedColor.r}, ${result.detectedColor.g}, ${result.detectedColor.b})`
                      : "No color detected"}
                    {result.processingMethod && (
                      <div className="text-xs text-blue-600 mt-1">Method: {result.processingMethod}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-medium ${
                        result.status === "ok"
                          ? "text-green-600"
                          : result.status === "high"
                            ? "text-red-600"
                            : "text-yellow-600"
                      }`}
                    >
                      {result.value}
                      {result.unit} ({result.status ? result.status.toUpperCase() : "UNKNOWN"})
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tips for Better Results */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-sm text-blue-800 mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Tips for Better Accuracy
            </h4>
            <div className="text-xs text-blue-700 space-y-1">
              <div>
                📸 <strong>Photography:</strong> Use good lighting, avoid shadows, keep test strip centered
              </div>
              <div>
                ⏱️ <strong>Timing:</strong> Wait for colors to fully develop (usually 15-60 seconds)
              </div>
              <div>
                🎯 <strong>Positioning:</strong> Fill most of the frame with the test strip
              </div>
              <div>
                🧹 <strong>Cleanliness:</strong> Clean camera lens and ensure test strip is dry
              </div>
              <div>
                📐 <strong>Orientation:</strong> Keep test strip straight (vertical or horizontal)
              </div>
            </div>
          </div>

          {/* Enhanced Technical Details */}
          <details className="text-xs">
            <summary className="font-medium cursor-pointer text-gray-700 hover:text-gray-900">
              Advanced Technical Processing Details
            </summary>
            <div className="mt-2 p-2 bg-gray-50 rounded text-gray-600 space-y-1">
              <div>• HSV color space conversion for perceptual accuracy</div>
              <div>• Hue-based color clustering (15° groupings)</div>
              <div>• Saturation and value weighting for color prominence</div>
              <div>• Circular hue distance calculations</div>
              <div>• Multi-cluster confidence scoring</div>
              <div>• Enhanced background filtering (white/gray removal)</div>
              <div>• Interpolation between closest HSV matches</div>
              <div>• Fallback to RGB analysis if HSV fails</div>
            </div>
          </details>
        </div>
      </CardContent>
    </Card>
  )
}
