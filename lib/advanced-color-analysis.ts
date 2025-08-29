// Advanced color analysis using HSV color space and improved algorithms
export interface HSV {
  h: number // Hue (0-360)
  s: number // Saturation (0-100)
  v: number // Value/Brightness (0-100)
}

export interface RGB {
  r: number
  g: number
  b: number
}

export interface ColorCluster {
  color: RGB
  hsv: HSV
  count: number
  confidence: number
}

// Convert RGB to HSV color space for better color matching
export function rgbToHsv(rgb: RGB): HSV {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const diff = max - min

  let h = 0
  let s = 0
  const v = max

  if (diff !== 0) {
    s = diff / max

    switch (max) {
      case r:
        h = ((g - b) / diff + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / diff + 2) / 6
        break
      case b:
        h = ((r - g) / diff + 4) / 6
        break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  }
}

// Convert HSV back to RGB
export function hsvToRgb(hsv: HSV): RGB {
  const h = hsv.h / 360
  const s = hsv.s / 100
  const v = hsv.v / 100

  const c = v * s
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1))
  const m = v - c

  let r = 0,
    g = 0,
    b = 0

  if (h >= 0 && h < 1 / 6) {
    r = c
    g = x
    b = 0
  } else if (h >= 1 / 6 && h < 2 / 6) {
    r = x
    g = c
    b = 0
  } else if (h >= 2 / 6 && h < 3 / 6) {
    r = 0
    g = c
    b = x
  } else if (h >= 3 / 6 && h < 4 / 6) {
    r = 0
    g = x
    b = c
  } else if (h >= 4 / 6 && h < 5 / 6) {
    r = x
    g = 0
    b = c
  } else {
    r = c
    g = 0
    b = x
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  }
}

// Calculate color distance in HSV space (more perceptually accurate)
export function hsvColorDistance(hsv1: HSV, hsv2: HSV): number {
  // Hue distance (circular)
  const hueDiff = Math.min(Math.abs(hsv1.h - hsv2.h), 360 - Math.abs(hsv1.h - hsv2.h))
  const satDiff = Math.abs(hsv1.s - hsv2.s)
  const valDiff = Math.abs(hsv1.v - hsv2.v)

  // Weight hue more heavily for colorful pixels, less for gray pixels
  const hueWeight = Math.min(hsv1.s, hsv2.s) / 100
  const satWeight = 0.8
  const valWeight = 0.6

  return Math.sqrt(
    Math.pow(hueDiff * hueWeight, 2) + Math.pow(satDiff * satWeight, 2) + Math.pow(valDiff * valWeight, 2),
  )
}

// Enhanced color extraction with HSV analysis and clustering
export function extractDominantColorAdvanced(
  imageData: ImageData,
  x: number,
  y: number,
  width: number,
  height: number,
): { color: RGB; confidence: number; clusters: ColorCluster[] } {
  const colorMap = new Map<string, { rgb: RGB; hsv: HSV; count: number }>()
  const step = 2 // Sample every 2nd pixel for better accuracy

  // Focus on center 50% of the region to avoid edges
  const centerX = x + Math.floor(width * 0.25)
  const centerY = y + Math.floor(height * 0.25)
  const centerWidth = Math.floor(width * 0.5)
  const centerHeight = Math.floor(height * 0.5)

  for (let py = centerY; py < centerY + centerHeight; py += step) {
    for (let px = centerX; px < centerX + centerWidth; px += step) {
      if (px >= 0 && px < imageData.width && py >= 0 && py < imageData.height) {
        const index = (py * imageData.width + px) * 4
        const alpha = imageData.data[index + 3]

        if (alpha > 200) {
          const rgb = {
            r: imageData.data[index],
            g: imageData.data[index + 1],
            b: imageData.data[index + 2],
          }

          // Skip near-white pixels (background)
          if (rgb.r > 235 && rgb.g > 235 && rgb.b > 235) continue

          // Skip near-black pixels (shadows/text)
          if (rgb.r < 25 && rgb.g < 25 && rgb.b < 25) continue

          const hsv = rgbToHsv(rgb)

          // Skip very low saturation (gray) pixels unless they're the majority
          if (hsv.s < 15 && hsv.v > 80) continue

          // Group similar colors in HSV space (more perceptually accurate)
          const hueGroup = Math.floor(hsv.h / 15) // Group by 15-degree hue ranges
          const satGroup = Math.floor(hsv.s / 20) // Group by 20% saturation ranges
          const valGroup = Math.floor(hsv.v / 20) // Group by 20% value ranges
          const colorKey = `${hueGroup}-${satGroup}-${valGroup}`

          if (colorMap.has(colorKey)) {
            const existing = colorMap.get(colorKey)!
            existing.count++
            // Update to more saturated/brighter version if found
            if (hsv.s > existing.hsv.s || (hsv.s === existing.hsv.s && hsv.v > existing.hsv.v)) {
              existing.rgb = rgb
              existing.hsv = hsv
            }
          } else {
            colorMap.set(colorKey, { rgb, hsv, count: 1 })
          }
        }
      }
    }
  }

  if (colorMap.size === 0) {
    return {
      color: { r: 255, g: 255, b: 255 },
      confidence: 0,
      clusters: [],
    }
  }

  // Convert to clusters and sort by score
  const clusters: ColorCluster[] = Array.from(colorMap.values())
    .map((data) => ({
      color: data.rgb,
      hsv: data.hsv,
      count: data.count,
      confidence: Math.min(1, (data.count * (data.hsv.s / 100) * (data.hsv.v / 100)) / 10),
    }))
    .sort((a, b) => {
      // Score based on count, saturation, and brightness
      const scoreA = a.count * (1 + a.hsv.s / 100) * (0.5 + a.hsv.v / 200)
      const scoreB = b.count * (1 + b.hsv.s / 100) * (0.5 + b.hsv.v / 200)
      return scoreB - scoreA
    })

  const dominantCluster = clusters[0]

  return {
    color: dominantCluster.color,
    confidence: dominantCluster.confidence,
    clusters: clusters.slice(0, 3), // Return top 3 clusters
  }
}

// Enhanced color references with HSV values for better matching
export const ENHANCED_COLOR_REFERENCES = {
  freeChlorine: [
    { range: [0, 0.5], hsv: { h: 60, s: 5, v: 95 }, status: "low" }, // Very light yellow/white
    { range: [0.5, 1.0], hsv: { h: 55, s: 15, v: 90 }, status: "low" }, // Light yellow
    { range: [1.0, 2.0], hsv: { h: 50, s: 25, v: 85 }, status: "ok" }, // Pale yellow
    { range: [2.0, 3.0], hsv: { h: 45, s: 35, v: 80 }, status: "ok" }, // Light orange-yellow
    { range: [3.0, 5.0], hsv: { h: 35, s: 50, v: 75 }, status: "ok" }, // Orange-yellow
    { range: [5.0, 10.0], hsv: { h: 25, s: 65, v: 70 }, status: "high" }, // Orange
    { range: [10.0, Number.POSITIVE_INFINITY], hsv: { h: 15, s: 80, v: 60 }, status: "high" }, // Dark orange
  ],
  ph: [
    { range: [6.2, 6.8], hsv: { h: 60, s: 100, v: 100 }, status: "low" }, // Bright yellow
    { range: [6.8, 7.0], hsv: { h: 50, s: 80, v: 90 }, status: "low" }, // Yellow-orange
    { range: [7.0, 7.2], hsv: { h: 40, s: 70, v: 85 }, status: "ok" }, // Light orange
    { range: [7.2, 7.6], hsv: { h: 25, s: 75, v: 80 }, status: "ok" }, // Orange
    { range: [7.6, 8.0], hsv: { h: 15, s: 80, v: 75 }, status: "high" }, // Red-orange
    { range: [8.0, 8.4], hsv: { h: 350, s: 70, v: 70 }, status: "high" }, // Pink-red
    { range: [8.4, 9.0], hsv: { h: 330, s: 80, v: 65 }, status: "high" }, // Magenta
  ],
  totalAlkalinity: [
    { range: [0, 40], hsv: { h: 65, s: 40, v: 90 }, status: "low" }, // Light yellow-green
    { range: [40, 60], hsv: { h: 70, s: 50, v: 85 }, status: "low" }, // Yellow-green
    { range: [60, 80], hsv: { h: 75, s: 60, v: 80 }, status: "low" }, // Green-yellow
    { range: [80, 120], hsv: { h: 85, s: 65, v: 75 }, status: "ok" }, // Light green
    { range: [120, 150], hsv: { h: 95, s: 70, v: 70 }, status: "ok" }, // Green
    { range: [150, 180], hsv: { h: 110, s: 75, v: 65 }, status: "high" }, // Blue-green
    { range: [180, 240], hsv: { h: 125, s: 80, v: 60 }, status: "high" }, // Dark green
  ],
  totalChlorine: [
    { range: [0, 0.5], hsv: { h: 30, s: 20, v: 85 }, status: "low" }, // Very light brown
    { range: [0.5, 1.0], hsv: { h: 25, s: 30, v: 80 }, status: "low" }, // Light brown
    { range: [1.0, 2.0], hsv: { h: 20, s: 40, v: 75 }, status: "ok" }, // Brown
    { range: [2.0, 3.0], hsv: { h: 15, s: 50, v: 70 }, status: "ok" }, // Dark brown
    { range: [3.0, 5.0], hsv: { h: 10, s: 60, v: 65 }, status: "ok" }, // Reddish brown
    { range: [5.0, 10.0], hsv: { h: 5, s: 70, v: 60 }, status: "high" }, // Dark reddish brown
  ],
  totalHardness: [
    { range: [0, 50], hsv: { h: 200, s: 30, v: 90 }, status: "low" }, // Very light blue
    { range: [50, 100], hsv: { h: 210, s: 40, v: 85 }, status: "low" }, // Light blue
    { range: [100, 150], hsv: { h: 220, s: 50, v: 80 }, status: "low" }, // Blue
    { range: [150, 250], hsv: { h: 240, s: 60, v: 75 }, status: "ok" }, // Blue-purple
    { range: [250, 400], hsv: { h: 260, s: 70, v: 70 }, status: "ok" }, // Purple
    { range: [400, 500], hsv: { h: 280, s: 75, v: 65 }, status: "high" }, // Purple-magenta
    { range: [500, 1000], hsv: { h: 300, s: 80, v: 60 }, status: "high" }, // Magenta
  ],
  cyanuricAcid: [
    { range: [0, 15], hsv: { h: 55, s: 25, v: 90 }, status: "low" }, // Very light yellow
    { range: [15, 30], hsv: { h: 50, s: 35, v: 85 }, status: "low" }, // Light yellow
    { range: [30, 50], hsv: { h: 45, s: 45, v: 80 }, status: "ok" }, // Yellow-orange
    { range: [50, 80], hsv: { h: 35, s: 55, v: 75 }, status: "ok" }, // Orange
    { range: [80, 100], hsv: { h: 25, s: 65, v: 70 }, status: "high" }, // Dark orange
    { range: [100, 150], hsv: { h: 15, s: 75, v: 65 }, status: "high" }, // Red-orange
    { range: [150, 240], hsv: { h: 5, s: 80, v: 60 }, status: "high" }, // Dark red-orange
  ],
}

// Enhanced color matching using HSV space
export function matchColorToValueAdvanced(
  extractedColor: RGB,
  parameter: keyof typeof ENHANCED_COLOR_REFERENCES,
): { value: number; status: "low" | "ok" | "high"; confidence: number } {
  const references = ENHANCED_COLOR_REFERENCES[parameter]
  const extractedHsv = rgbToHsv(extractedColor)

  // Find closest matches in HSV space
  const distances = references
    .map((ref, index) => ({
      distance: hsvColorDistance(extractedHsv, ref.hsv),
      index,
      ref,
    }))
    .sort((a, b) => a.distance - b.distance)

  const closest = distances[0]
  const secondClosest = distances[1]

  // Calculate confidence based on HSV distance
  const maxDistance = 200 // Reasonable max distance in HSV space
  const confidence = Math.max(0.1, Math.min(1, 1 - closest.distance / maxDistance))

  let value: number
  let status: "low" | "ok" | "high"

  if (closest.distance < 30 || !secondClosest) {
    // Very close match
    value = (closest.ref.range[0] + closest.ref.range[1]) / 2
    status = closest.ref.status as "low" | "ok" | "high"
  } else {
    // Interpolate between closest matches
    const totalDistance = closest.distance + secondClosest.distance
    const weight1 = secondClosest.distance / totalDistance
    const weight2 = closest.distance / totalDistance

    const value1 = (closest.ref.range[0] + closest.ref.range[1]) / 2
    const value2 = (secondClosest.ref.range[0] + secondClosest.ref.range[1]) / 2

    value = value1 * weight1 + value2 * weight2
    status = closest.ref.status as "low" | "ok" | "high"
  }

  return {
    value: Math.round(value * 10) / 10,
    status,
    confidence: Math.round(confidence * 100) / 100,
  }
}
