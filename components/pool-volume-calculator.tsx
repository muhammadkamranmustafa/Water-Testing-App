"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calculator, Waves } from "lucide-react"

interface PoolVolumeCalculatorProps {
  onVolumeCalculated: (volume: number) => void
  initialVolume?: number
}

type LengthUnit = "ft" | "inches" | "cm" | "metre"

export function PoolVolumeCalculator({ onVolumeCalculated, initialVolume }: PoolVolumeCalculatorProps) {
  const [shape, setShape] = useState<"rectangular" | "circular" | "oval" | "kidney">("rectangular")
  const [dimensions, setDimensions] = useState({
    length: "",
    width: "",
    diameter: "",
    shallowDepth: "",
    deepDepth: "",
  })
  const [lengthUnit, setLengthUnit] = useState<LengthUnit>("ft")
  const [calculatedVolume, setCalculatedVolume] = useState(initialVolume || 0)
  const [volumeResults, setVolumeResults] = useState<{ cubicMetres: number; litres: number; gallons: number } | null>(
    null,
  )
  const [manualVolume, setManualVolume] = useState(initialVolume?.toString() || "")
  const [useManual, setUseManual] = useState(!!initialVolume)

  const convertToMetres = (value: number, unit: LengthUnit): number => {
    switch (unit) {
      case "ft":
        return value / 3.2808
      case "inches":
        return value / 39.37
      case "cm":
        return value / 100
      case "metre":
        return value
      default:
        return value
    }
  }

  const handleCalculate = () => {
    const lengthM = convertToMetres(Number.parseFloat(dimensions.length) || 0, lengthUnit)
    const widthM = convertToMetres(Number.parseFloat(dimensions.width) || 0, lengthUnit)
    const diameterM = convertToMetres(Number.parseFloat(dimensions.diameter) || 0, lengthUnit)
    const shallowDepthM = convertToMetres(Number.parseFloat(dimensions.shallowDepth) || 0, lengthUnit)
    const deepDepthM = convertToMetres(Number.parseFloat(dimensions.deepDepth) || 0, lengthUnit)

    const dimsInMetres = {
      length: lengthM,
      width: widthM,
      diameter: diameterM,
      shallowDepth: shallowDepthM,
      deepDepth: deepDepthM,
    }

    // Calculate volume in cubic metres
    let volumeCubicMetres: number
    const avgDepth = (shallowDepthM + deepDepthM) / 2

    switch (shape) {
      case "rectangular":
        volumeCubicMetres = lengthM * widthM * avgDepth
        break
      case "circular":
        const radius = diameterM / 2
        volumeCubicMetres = Math.PI * radius * radius * avgDepth
        break
      case "oval":
        volumeCubicMetres = Math.PI * (lengthM / 2) * (widthM / 2) * avgDepth
        break
      case "kidney":
        // Approximate kidney shape as 0.85 of rectangular
        volumeCubicMetres = lengthM * widthM * avgDepth * 0.85
        break
      default:
        volumeCubicMetres = 0
    }

    const volumeLitres = volumeCubicMetres * 1000
    const volumeGallons = volumeCubicMetres * 222 // Imperial gallons

    const results = {
      cubicMetres: volumeCubicMetres,
      litres: volumeLitres,
      gallons: volumeGallons,
    }

    setVolumeResults(results)
    setCalculatedVolume(volumeGallons) // Keep gallons for backward compatibility
    onVolumeCalculated(volumeGallons)
  }

  const handleManualVolume = () => {
    const volume = Number.parseFloat(manualVolume) || 0
    setCalculatedVolume(volume)
    onVolumeCalculated(volume)
    const cubicMetres = volume / 222
    const litres = cubicMetres * 1000
    setVolumeResults({
      cubicMetres,
      litres,
      gallons: volume,
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Waves className="h-4 w-4 sm:h-5 sm:w-5" />
          Calculate hot tub or swimming pool volume
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

            <div>
              <Label className="text-sm font-medium">Measurement Unit</Label>
              <Select value={lengthUnit} onValueChange={(value: LengthUnit) => setLengthUnit(value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ft">Feet (ft)</SelectItem>
                  <SelectItem value="inches">Inches (in)</SelectItem>
                  <SelectItem value="cm">Centimetres (cm)</SelectItem>
                  <SelectItem value="metre">Metres (m)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {shape !== "circular" && (
                <>
                  <div>
                    <Label htmlFor="length" className="text-sm">
                      Length ({lengthUnit})
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
                      Width ({lengthUnit})
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
                    Diameter ({lengthUnit})
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
                  Shallow End Depth ({lengthUnit})
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
                  Deep End Depth ({lengthUnit})
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
              Calculate hot tub or swimming pool volume
            </Button>
          </div>
        )}

        {volumeResults && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg">Volume Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-white rounded-lg">
                  <div className="text-lg sm:text-xl font-bold text-blue-600">
                    {volumeResults.cubicMetres.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-600">Cubic Metres</div>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <div className="text-lg sm:text-xl font-bold text-blue-600">{volumeResults.litres.toFixed(0)}</div>
                  <div className="text-xs text-gray-600">Litres</div>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <div className="text-lg sm:text-xl font-bold text-blue-600">{volumeResults.gallons.toFixed(0)}</div>
                  <div className="text-xs text-gray-600">Imperial Gallons</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}
