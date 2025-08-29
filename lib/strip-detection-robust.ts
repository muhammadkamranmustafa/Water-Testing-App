import type { AnalysisResult } from "./color-analysis"

export interface DetectedStrip {
  bounds: { x: number; y: number; width: number; height: number }
  angle: number
  confidence: number
  isVertical: boolean
  bandPositions: Array<{ x: number; y: number; width: number; height: number }>
}

export async function detectAndAnalyzeTestStrip(imageUrl: string): Promise<Record<string, AnalysisResult>> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")!

        // Resize image for faster processing while maintaining aspect ratio
        const maxSize = 800
        const scale = Math.min(maxSize / img.width, maxSize / img.height)
        canvas.width = img.width * scale
        canvas.height = img.height * scale

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

        // Step 1: Detect test strip
        const detectedStrip = detectTestStripInImage(imageData)

        if (!detectedStrip) {
          // Fallback to center-based analysis
          resolve(analyzeWithFallback(imageData))
          return
        }

        // Step 2: Extract and analyze colors from detected strip
        const results = analyzeDetectedStrip(imageData, detectedStrip)
        resolve(results)
      } catch (error) {
        console.error("Strip detection failed:", error)
        reject(new Error("Strip detection failed"))
      }
    }

    img.onerror = () => reject(new Error("Failed to load image"))
    img.src = imageUrl
  })
}

function detectTestStripInImage(imageData: ImageData): DetectedStrip | null {
  const { data, width, height } = imageData

  // Convert to grayscale for edge detection
  const grayscale = new Uint8Array(width * height)
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
    grayscale[i / 4] = gray
  }

  // Find rectangular regions that could be test strips
  const candidates = findRectangularRegions(grayscale, width, height)

  // Score candidates based on test strip characteristics
  const bestCandidate = scoreCandidates(candidates, imageData)

  if (!bestCandidate || bestCandidate.confidence < 0.3) {
    return null
  }

  return bestCandidate
}

function findRectangularRegions(grayscale: Uint8Array, width: number, height: number): DetectedStrip[] {
  const candidates: DetectedStrip[] = []

  // Simple edge detection using gradient
  const edges = new Uint8Array(width * height)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x
      const gx = grayscale[idx + 1] - grayscale[idx - 1]
      const gy = grayscale[idx + width] - grayscale[idx - width]
      edges[idx] = Math.min(255, Math.sqrt(gx * gx + gy * gy))
    }
  }

  // Find potential strip regions using sliding window
  const minStripWidth = Math.min(width, height) * 0.1
  const maxStripWidth = Math.min(width, height) * 0.4
  const minStripHeight = Math.max(width, height) * 0.3

  for (let y = 0; y < height - minStripHeight; y += 10) {
    for (let x = 0; x < width - minStripWidth; x += 10) {
      // Try vertical strips
      for (let w = minStripWidth; w <= maxStripWidth && x + w < width; w += 10) {
        for (let h = minStripHeight; h <= height - y && y + h < height; h += 20) {
          const bounds = { x, y, width: w, height: h }
          const confidence = evaluateStripRegion(edges, bounds, width, height)

          if (confidence > 0.2) {
            candidates.push({
              bounds,
              angle: 0,
              confidence,
              isVertical: h > w,
              bandPositions: [],
            })
          }
        }
      }
    }
  }

  return candidates.sort((a, b) => b.confidence - a.confidence).slice(0, 5)
}

function evaluateStripRegion(
  edges: Uint8Array,
  bounds: { x: number; y: number; width: number; height: number },
  imageWidth: number,
  imageHeight: number,
): number {
  const { x, y, width, height } = bounds

  // Check if region has strong vertical or horizontal edges (indicating strip boundaries)
  let edgeStrength = 0
  let pixelCount = 0

  // Check left and right edges for vertical strips
  for (let py = y; py < y + height; py++) {
    if (x > 0) edgeStrength += edges[py * imageWidth + x]
    if (x + width < imageWidth) edgeStrength += edges[py * imageWidth + (x + width - 1)]
    pixelCount += 2
  }

  // Check top and bottom edges
  for (let px = x; px < x + width; px++) {
    if (y > 0) edgeStrength += edges[y * imageWidth + px]
    if (y + height < imageHeight) edgeStrength += edges[(y + height - 1) * imageWidth + px]
    pixelCount += 2
  }

  const avgEdgeStrength = pixelCount > 0 ? edgeStrength / pixelCount : 0

  // Prefer regions with good aspect ratio for test strips
  const aspectRatio = height / width
  const aspectScore = aspectRatio > 2 && aspectRatio < 8 ? 1 : Math.max(0, 1 - Math.abs(aspectRatio - 4) / 4)

  return (avgEdgeStrength / 255) * aspectScore
}

function scoreCandidates(candidates: DetectedStrip[], imageData: ImageData): DetectedStrip | null {
  if (candidates.length === 0) return null

  let bestCandidate = candidates[0]

  for (const candidate of candidates) {
    // Generate band positions for this candidate
    candidate.bandPositions = generateBandPositions(candidate.bounds, candidate.isVertical)

    // Score based on color variation in bands (test strips should have distinct colors)
    const colorScore = evaluateColorVariation(imageData, candidate.bandPositions)
    candidate.confidence = (candidate.confidence + colorScore) / 2

    if (candidate.confidence > bestCandidate.confidence) {
      bestCandidate = candidate
    }
  }

  return bestCandidate
}

function generateBandPositions(
  bounds: { x: number; y: number; width: number; height: number },
  isVertical: boolean,
): Array<{ x: number; y: number; width: number; height: number }> {
  const positions = []
  const bandCount = 6

  if (isVertical) {
    const bandHeight = bounds.height / (bandCount + 1) // Add spacing
    const bandWidth = bounds.width * 0.8 // Use 80% of width to avoid edges
    const startX = bounds.x + bounds.width * 0.1

    for (let i = 0; i < bandCount; i++) {
      const y = bounds.y + (i + 1) * bandHeight
      positions.push({
        x: startX,
        y: y - bandHeight * 0.2,
        width: bandWidth,
        height: bandHeight * 0.4,
      })
    }
  } else {
    // Horizontal strip
    const bandWidth = bounds.width / (bandCount + 1)
    const bandHeight = bounds.height * 0.8
    const startY = bounds.y + bounds.height * 0.1

    for (let i = 0; i < bandCount; i++) {
      const x = bounds.x + (i + 1) * bandWidth
      positions.push({
        x: x - bandWidth * 0.2,
        y: startY,
        width: bandWidth * 0.4,
        height: bandHeight,
      })
    }
  }

  return positions
}

function evaluateColorVariation(
  imageData: ImageData,
  bandPositions: Array<{ x: number; y: number; width: number; height: number }>,
): number {
  const colors = bandPositions.map((pos) => extractDominantColor(imageData, pos))

  // Calculate color variation between bands
  let totalVariation = 0
  let comparisons = 0

  for (let i = 0; i < colors.length - 1; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const color1 = colors[i]
      const color2 = colors[j]
      const distance = Math.sqrt(
        Math.pow(color1.r - color2.r, 2) + Math.pow(color1.g - color2.g, 2) + Math.pow(color1.b - color2.b, 2),
      )
      totalVariation += distance
      comparisons++
    }
  }

  const avgVariation = comparisons > 0 ? totalVariation / comparisons : 0
  return Math.min(1, avgVariation / 100) // Normalize to 0-1
}

function extractDominantColor(
  imageData: ImageData,
  bounds: { x: number; y: number; width: number; height: number },
): { r: number; g: number; b: number } {
  const { data, width } = imageData
  const { x, y, width: w, height: h } = bounds

  let r = 0,
    g = 0,
    b = 0,
    count = 0

  for (let py = Math.max(0, Math.floor(y)); py < Math.min(imageData.height, Math.ceil(y + h)); py++) {
    for (let px = Math.max(0, Math.floor(x)); px < Math.min(width, Math.ceil(x + w)); px++) {
      const idx = (py * width + px) * 4
      r += data[idx]
      g += data[idx + 1]
      b += data[idx + 2]
      count++
    }
  }

  return count > 0
    ? {
        r: Math.round(r / count),
        g: Math.round(g / count),
        b: Math.round(b / count),
      }
    : { r: 0, g: 0, b: 0 }
}

function analyzeDetectedStrip(imageData: ImageData, strip: DetectedStrip): Record<string, AnalysisResult> {
  const parameterNames = ["freeChlorine", "ph", "totalAlkalinity", "totalChlorine", "totalHardness", "cyanuricAcid"]
  const results: Record<string, AnalysisResult> = {}

  console.log(`Analyzing detected strip at bounds:`, strip.bounds)
  console.log(`Strip confidence: ${strip.confidence}, isVertical: ${strip.isVertical}`)

  for (let i = 0; i < Math.min(parameterNames.length, strip.bandPositions.length); i++) {
    const paramName = parameterNames[i]
    const bandPos = strip.bandPositions[i]

    console.log(`Analyzing ${paramName} at detected position:`, bandPos)

    const detectedColor = extractDominantColor(imageData, bandPos)
    console.log(`Detected color for ${paramName}:`, detectedColor)

    // Use the same color matching logic as before
    const matchResult = matchColorToParameter(detectedColor, paramName)

    results[paramName] = {
      value: matchResult.value,
      status: matchResult.status,
      unit: matchResult.unit,
      confidence: Math.min(strip.confidence, matchResult.confidence),
      detectedColor,
      processingMethod: "robust-strip-detection",
    }
  }

  return results
}

function analyzeWithFallback(imageData: ImageData): Record<string, AnalysisResult> {
  // Fallback to center-based analysis when strip detection fails
  console.log("Using fallback analysis - strip detection failed")

  const parameterNames = ["freeChlorine", "ph", "totalAlkalinity", "totalChlorine", "totalHardness", "cyanuricAcid"]
  const results: Record<string, AnalysisResult> = {}

  const { width, height } = imageData
  const centerX = width * 0.3
  const bandWidth = width * 0.4
  const bandHeight = height * 0.02

  const bandPositions = [0.18, 0.28, 0.38, 0.52, 0.64, 0.78]

  for (let i = 0; i < parameterNames.length; i++) {
    const paramName = parameterNames[i]
    const y = height * bandPositions[i]

    const bounds = {
      x: centerX,
      y: y - bandHeight / 2,
      width: bandWidth,
      height: bandHeight,
    }

    const detectedColor = extractDominantColor(imageData, bounds)
    const matchResult = matchColorToParameter(detectedColor, paramName)

    results[paramName] = {
      value: matchResult.value,
      status: matchResult.status,
      unit: matchResult.unit,
      confidence: matchResult.confidence * 0.7, // Lower confidence for fallback
      detectedColor,
      processingMethod: "fallback-center-analysis",
    }
  }

  return results
}

// Import the color matching logic from the existing color-analysis file
function matchColorToParameter(
  color: { r: number; g: number; b: number },
  paramName: string,
): {
  value: number
  status: string
  unit: string
  confidence: number
} {
  // This would use the same COLOR_REFERENCES and matching logic from color-analysis.ts
  // For now, returning a placeholder - this should be imported from the main color analysis
  return {
    value: 0,
    status: "unknown",
    unit: "ppm",
    confidence: 0.5,
  }
}
