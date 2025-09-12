"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Calculator } from "lucide-react"

interface VolumeCalculatorProps {
  onClose: () => void
}

type LengthUnit = "ft" | "inches" | "cm" | "metre"
type VolumeUnit = "gallons" | "litres" | "cubic-metres"

export function VolumeCalculator({ onClose }: VolumeCalculatorProps) {
  const [shape, setShape] = useState<"rectangular" | "circular">("rectangular")
  const [length, setLength] = useState("")
  const [width, setWidth] = useState("")
  const [diameter, setDiameter] = useState("")
  const [depth, setDepth] = useState("")
  const [lengthUnit, setLengthUnit] = useState<LengthUnit>("ft")
  const [volumeUnit, setVolumeUnit] = useState<VolumeUnit>("gallons")
  const [results, setResults] = useState<{ cubicMetres: number; litres: number; gallons: number } | null>(null)

  // Conversion functions
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

  const calculateVolume = () => {
    const lengthM = convertToMetres(Number.parseFloat(length), lengthUnit)
    const widthM = shape === "rectangular" ? convertToMetres(Number.parseFloat(width), lengthUnit) : 0
    const diameterM = shape === "circular" ? convertToMetres(Number.parseFloat(diameter), lengthUnit) : 0
    const depthM = convertToMetres(Number.parseFloat(depth), lengthUnit)

    let volumeCubicMetres: number

    if (shape === "rectangular") {
      volumeCubicMetres = lengthM * widthM * depthM
    } else {
      const radius = diameterM / 2
      volumeCubicMetres = Math.PI * radius * radius * depthM
    }

    const volumeLitres = volumeCubicMetres * 1000
    const volumeGallons = volumeCubicMetres * 222

    setResults({
      cubicMetres: volumeCubicMetres,
      litres: volumeLitres,
      gallons: volumeGallons,
    })
  }

  const isValidInput = () => {
    if (shape === "rectangular") {
      return (
        length &&
        width &&
        depth &&
        Number.parseFloat(length) > 0 &&
        Number.parseFloat(width) > 0 &&
        Number.parseFloat(depth) > 0
      )
    } else {
      return diameter && depth && Number.parseFloat(diameter) > 0 && Number.parseFloat(depth) > 0
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="h-6 w-6 text-blue-600" />
              <CardTitle>Calculate hot tub or swimming pool volume</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>Calculate your pool or hot tub volume to determine chemical dosages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-base font-medium">Pool Shape</Label>
            <div className="flex gap-2 mt-2">
              <Button
                variant={shape === "rectangular" ? "default" : "outline"}
                onClick={() => setShape("rectangular")}
                className="flex-1"
              >
                Rectangular
              </Button>
              <Button
                variant={shape === "circular" ? "default" : "outline"}
                onClick={() => setShape("circular")}
                className="flex-1"
              >
                Circular
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-base font-medium">Measurement Unit</Label>
            <Select value={lengthUnit} onValueChange={(value: LengthUnit) => setLengthUnit(value)}>
              <SelectTrigger className="mt-2">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shape === "rectangular" ? (
              <>
                <div>
                  <Label htmlFor="length">Length ({lengthUnit})</Label>
                  <Input
                    id="length"
                    type="number"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    placeholder="Enter length"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="width">Width ({lengthUnit})</Label>
                  <Input
                    id="width"
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder="Enter width"
                    className="mt-1"
                  />
                </div>
              </>
            ) : (
              <div>
                <Label htmlFor="diameter">Diameter ({lengthUnit})</Label>
                <Input
                  id="diameter"
                  type="number"
                  value={diameter}
                  onChange={(e) => setDiameter(e.target.value)}
                  placeholder="Enter diameter"
                  className="mt-1"
                />
              </div>
            )}
            <div>
              <Label htmlFor="depth">Depth ({lengthUnit})</Label>
              <Input
                id="depth"
                type="number"
                value={depth}
                onChange={(e) => setDepth(e.target.value)}
                placeholder="Enter depth"
                className="mt-1"
              />
            </div>
          </div>

          <Button onClick={calculateVolume} disabled={!isValidInput()} className="w-full">
            <Calculator className="h-4 w-4 mr-2" />
            Calculate hot tub or swimming pool volume
          </Button>

          {results && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg">Volume Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{results.cubicMetres.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">Cubic Metres</div>
                  </div>
                  <div className="p-4 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{results.litres.toFixed(0)}</div>
                    <div className="text-sm text-gray-600">Litres</div>
                  </div>
                  <div className="p-4 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{results.gallons.toFixed(0)}</div>
                    <div className="text-sm text-gray-600">Imperial Gallons</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
