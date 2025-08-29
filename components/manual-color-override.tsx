"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Palette, RotateCcw, Check } from "lucide-react"
import type { AnalysisResult } from "@/lib/color-analysis"

interface ManualColorOverrideProps {
  results: Record<string, AnalysisResult>
  onOverride: (
    parameter: string,
    newValue: number,
    newStatus: string,
    newColor?: { r: number; g: number; b: number },
  ) => void
  stripType: "3-in-1" | "6-in-1"
}

const COLOR_REFERENCES = {
  freeChlorine: {
    name: "Free Chlorine",
    unit: "ppm",
    colors: [
      { color: "#FFFFFF", value: 0, label: "0" },
      { color: "#FFF8DC", value: 0.5, label: "0.5" },
      { color: "#FFEB9C", value: 1.0, label: "1.0" },
      { color: "#FFD700", value: 2.0, label: "2.0" },
      { color: "#FFA500", value: 3.0, label: "3.0" },
      { color: "#FF8C00", value: 5.0, label: "5.0" },
      { color: "#FF6347", value: 10.0, label: "10+" },
    ],
  },
  ph: {
    name: "pH",
    unit: "",
    colors: [
      { color: "#FF0000", value: 6.2, label: "6.2" },
      { color: "#FF4500", value: 6.8, label: "6.8" },
      { color: "#FFA500", value: 7.2, label: "7.2" },
      { color: "#FFFF00", value: 7.6, label: "7.6" },
      { color: "#9ACD32", value: 8.0, label: "8.0" },
      { color: "#32CD32", value: 8.4, label: "8.4" },
      { color: "#006400", value: 9.0, label: "9.0+" },
    ],
  },
  totalAlkalinity: {
    name: "Total Alkalinity",
    unit: "ppm",
    colors: [
      { color: "#FFFF00", value: 0, label: "0" },
      { color: "#ADFF2F", value: 40, label: "40" },
      { color: "#7CFC00", value: 80, label: "80" },
      { color: "#32CD32", value: 120, label: "120" },
      { color: "#228B22", value: 180, label: "180" },
      { color: "#006400", value: 240, label: "240+" },
    ],
  },
  totalChlorine: {
    name: "Total Chlorine",
    unit: "ppm",
    colors: [
      { color: "#FFFFFF", value: 0, label: "0" },
      { color: "#FFB6C1", value: 0.5, label: "0.5" },
      { color: "#FF69B4", value: 1.0, label: "1.0" },
      { color: "#FF1493", value: 3.0, label: "3.0" },
      { color: "#DC143C", value: 5.0, label: "5.0" },
      { color: "#8B0000", value: 10.0, label: "10+" },
    ],
  },
  totalHardness: {
    name: "Total Hardness",
    unit: "ppm",
    colors: [
      { color: "#E6E6FA", value: 0, label: "0" },
      { color: "#DDA0DD", value: 50, label: "50" },
      { color: "#DA70D6", value: 100, label: "100" },
      { color: "#BA55D3", value: 250, label: "250" },
      { color: "#9932CC", value: 500, label: "500" },
      { color: "#4B0082", value: 1000, label: "1000+" },
    ],
  },
  cyanuricAcid: {
    name: "Cyanuric Acid",
    unit: "ppm",
    colors: [
      { color: "#FFFACD", value: 0, label: "0" },
      { color: "#F0E68C", value: 30, label: "30" },
      { color: "#DAA520", value: 50, label: "50" },
      { color: "#B8860B", value: 100, label: "100" },
      { color: "#8B7355", value: 150, label: "150" },
      { color: "#654321", value: 240, label: "240+" },
    ],
  },
}

export function ManualColorOverride({ results, onOverride, stripType }: ManualColorOverrideProps) {
  const [selectedParameter, setSelectedParameter] = useState<string | null>(null)
  const [overrides, setOverrides] = useState<Record<string, boolean>>({})

  const getParametersForStripType = () => {
    if (stripType === "3-in-1") {
      return ["freeChlorine", "ph", "totalAlkalinity"]
    }
    return ["freeChlorine", "ph", "totalAlkalinity", "totalChlorine", "totalHardness", "cyanuricAcid"]
  }

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: Number.parseInt(result[1], 16),
          g: Number.parseInt(result[2], 16),
          b: Number.parseInt(result[3], 16),
        }
      : { r: 128, g: 128, b: 128 }
  }

  const handleColorSelect = (parameter: string, value: number) => {
    const getStatus = (param: string, val: number) => {
      if (param === "ph") {
        return val >= 7.2 && val <= 7.6 ? "ok" : val < 7.2 ? "low" : "high"
      }
      if (param === "freeChlorine") {
        return val >= 1.0 && val <= 3.0 ? "ok" : val < 1.0 ? "low" : "high"
      }
      if (param === "totalAlkalinity") {
        return val >= 80 && val <= 120 ? "ok" : val < 80 ? "low" : "high"
      }
      return val <= 3.0 ? "ok" : "high"
    }

    const colorRef = COLOR_REFERENCES[parameter as keyof typeof COLOR_REFERENCES]
    const selectedColorOption = colorRef?.colors.find((c) => c.value === value)
    const newColor = selectedColorOption ? hexToRgb(selectedColorOption.color) : undefined

    const status = getStatus(parameter, value)
    onOverride(parameter, value, status, newColor)
    setOverrides((prev) => ({ ...prev, [parameter]: true }))
    setSelectedParameter(null)
  }

  const resetOverride = (parameter: string) => {
    setOverrides((prev) => ({ ...prev, [parameter]: false }))
    // Reset to original detected value would need to be handled by parent
  }

  const parameters = getParametersForStripType()

  return (
    <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Palette className="h-5 w-5 text-purple-600" />
          </div>
          Manual Color Override
          <Badge variant="outline" className="ml-auto">
            {stripType.toUpperCase()}
          </Badge>
        </CardTitle>
        <p className="text-gray-600">
          Click on a parameter to manually adjust its value using the color reference chart
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {parameters.map((param) => {
            const result = results[param]
            const colorRef = COLOR_REFERENCES[param as keyof typeof COLOR_REFERENCES]
            const isOverridden = overrides[param]

            if (!result || !colorRef) return null

            return (
              <div key={param} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{colorRef.name}</h3>
                    {isOverridden && (
                      <Badge variant="secondary" className="text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        Override
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {result.value} {colorRef.unit}
                    </span>
                    {isOverridden && (
                      <Button size="sm" variant="ghost" onClick={() => resetOverride(param)} className="h-6 w-6 p-0">
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {colorRef.colors.map((colorOption, index) => (
                    <button
                      key={index}
                      onClick={() => handleColorSelect(param, colorOption.value)}
                      className="group relative flex flex-col items-center p-2 rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors"
                      style={{ backgroundColor: colorOption.color }}
                    >
                      <div
                        className="w-8 h-8 rounded border border-gray-300 shadow-sm"
                        style={{ backgroundColor: colorOption.color }}
                      />
                      <span className="text-xs font-medium mt-1 text-gray-700 bg-white/80 px-1 rounded">
                        {colorOption.label}
                      </span>

                      {Math.abs(result.value - colorOption.value) < 0.1 && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="h-2 w-2 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
