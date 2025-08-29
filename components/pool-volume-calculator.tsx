"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calculator, Waves } from "lucide-react"
import { calculatePoolVolume } from "@/lib/chemical-calculator"

interface PoolVolumeCalculatorProps {
  onVolumeCalculated: (volume: number) => void
  initialVolume?: number
}

export function PoolVolumeCalculator({ onVolumeCalculated, initialVolume }: PoolVolumeCalculatorProps) {
  const [shape, setShape] = useState<"rectangular" | "circular" | "oval" | "kidney">("rectangular")
  const [dimensions, setDimensions] = useState({
    length: "",
    width: "",
    diameter: "",
    shallowDepth: "",
    deepDepth: "",
  })
  const [calculatedVolume, setCalculatedVolume] = useState(initialVolume || 0)
  const [manualVolume, setManualVolume] = useState(initialVolume?.toString() || "")
  const [useManual, setUseManual] = useState(!!initialVolume)

  const handleCalculate = () => {
    const dims = {
      length: Number.parseFloat(dimensions.length) || 0,
      width: Number.parseFloat(dimensions.width) || 0,
      diameter: Number.parseFloat(dimensions.diameter) || 0,
      shallowDepth: Number.parseFloat(dimensions.shallowDepth) || 0,
      deepDepth: Number.parseFloat(dimensions.deepDepth) || 0,
    }

    const volume = calculatePoolVolume(shape, dims)
    setCalculatedVolume(volume)
    onVolumeCalculated(volume)
  }

  const handleManualVolume = () => {
    const volume = Number.parseFloat(manualVolume) || 0
    setCalculatedVolume(volume)
    onVolumeCalculated(volume)
  }

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Waves className="h-4 w-4 sm:h-5 sm:w-5" />
          Pool Volume Calculator
        </CardTitle>
        <CardDescription className="text-sm">Calculate your pool volume for accurate chemical dosing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
        <div className="flex gap-1 sm:gap-2">
          <Button
            variant={!useManual ? "default" : "outline"}
            onClick={() => setUseManual(false)}
            size="sm"
            className="flex-1 text-xs sm:text-sm"
          >
            Calculate Volume
          </Button>
          <Button
            variant={useManual ? "default" : "outline"}
            onClick={() => setUseManual(true)}
            size="sm"
            className="flex-1 text-xs sm:text-sm"
          >
            Enter Known Volume
          </Button>
        </div>

        {useManual ? (
          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label htmlFor="manual-volume" className="text-sm">
                Pool Volume (gallons)
              </Label>
              <Input
                id="manual-volume"
                type="number"
                placeholder="Enter pool volume in gallons"
                value={manualVolume}
                onChange={(e) => setManualVolume(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button onClick={handleManualVolume} className="w-full" size="sm">
              Use This Volume
            </Button>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label htmlFor="pool-shape" className="text-sm">
                Pool Shape
              </Label>
              <Select value={shape} onValueChange={(value: any) => setShape(value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select pool shape" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rectangular">Rectangular</SelectItem>
                  <SelectItem value="circular">Circular</SelectItem>
                  <SelectItem value="oval">Oval</SelectItem>
                  <SelectItem value="kidney">Kidney</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {shape !== "circular" && (
                <>
                  <div>
                    <Label htmlFor="length" className="text-sm">
                      Length (ft)
                    </Label>
                    <Input
                      id="length"
                      type="number"
                      placeholder="Length"
                      value={dimensions.length}
                      onChange={(e) => setDimensions((prev) => ({ ...prev, length: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="width" className="text-sm">
                      Width (ft)
                    </Label>
                    <Input
                      id="width"
                      type="number"
                      placeholder="Width"
                      value={dimensions.width}
                      onChange={(e) => setDimensions((prev) => ({ ...prev, width: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </>
              )}

              {shape === "circular" && (
                <div className="sm:col-span-2">
                  <Label htmlFor="diameter" className="text-sm">
                    Diameter (ft)
                  </Label>
                  <Input
                    id="diameter"
                    type="number"
                    placeholder="Diameter"
                    value={dimensions.diameter}
                    onChange={(e) => setDimensions((prev) => ({ ...prev, diameter: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="shallow-depth" className="text-sm">
                  Shallow End Depth (ft)
                </Label>
                <Input
                  id="shallow-depth"
                  type="number"
                  step="0.5"
                  placeholder="3.0"
                  value={dimensions.shallowDepth}
                  onChange={(e) => setDimensions((prev) => ({ ...prev, shallowDepth: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="deep-depth" className="text-sm">
                  Deep End Depth (ft)
                </Label>
                <Input
                  id="deep-depth"
                  type="number"
                  step="0.5"
                  placeholder="8.0"
                  value={dimensions.deepDepth}
                  onChange={(e) => setDimensions((prev) => ({ ...prev, deepDepth: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <Button onClick={handleCalculate} className="w-full" size="sm">
              <Calculator className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Calculate Volume
            </Button>
          </div>
        )}

        {calculatedVolume > 0 && (
          <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-blue-900">
                {Math.round(calculatedVolume).toLocaleString()} gallons
              </div>
              <div className="text-xs sm:text-sm text-blue-600">Pool Volume</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
