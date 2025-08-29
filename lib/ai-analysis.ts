export interface AIAnalysisResult {
  stripDetected: boolean
  stripBounds?: {
    x: number
    y: number
    width: number
    height: number
  }
  colorBands: Array<{
    position: number
    color: { r: number; g: number; b: number }
    confidence: number
  }>
  processingMethod: "ai" | "fallback" | "error"
}

// Hugging Face Inference API for object detection
async function detectStripWithAI(imageUrl: string): Promise<AIAnalysisResult> {
  try {
    // Convert image to blob for server API
    const response = await fetch(imageUrl)
    const blob = await response.blob()

    const formData = new FormData()
    formData.append("image", blob)

    // Call our secure server endpoint instead of direct API
    const serverResponse = await fetch("/api/analyze-strip", {
      method: "POST",
      body: formData,
    })

    if (!serverResponse.ok) {
      throw new Error(`Server analysis failed: ${serverResponse.status}`)
    }

    const result = await serverResponse.json()
    return result
  } catch (error) {
    console.warn("AI detection failed, using fallback:", error)
    return {
      stripDetected: false,
      colorBands: [],
      processingMethod: "fallback",
    }
  }
}

// Enhanced color analysis with better algorithms
export async function analyzeTestStripWithAI(imageUrl: string): Promise<any> {
  // First try AI detection
  const aiResult = await detectStripWithAI(imageUrl)

  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!

      // Resize for performance
      const maxSize = 800
      const scale = Math.min(maxSize / img.width, maxSize / img.height)
      canvas.width = img.width * scale
      canvas.height = img.height * scale

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      // Use AI bounds if available, otherwise use center region
      let analyzeRegion
      if (aiResult.stripDetected && aiResult.stripBounds) {
        analyzeRegion = {
          x: Math.floor(aiResult.stripBounds.x * scale),
          y: Math.floor(aiResult.stripBounds.y * scale),
          width: Math.floor(aiResult.stripBounds.width * scale),
          height: Math.floor(aiResult.stripBounds.height * scale),
        }
      } else {
        // Fallback: assume strip is in center 60% of image
        analyzeRegion = {
          x: Math.floor(canvas.width * 0.2),
          y: Math.floor(canvas.height * 0.1),
          width: Math.floor(canvas.width * 0.6),
          height: Math.floor(canvas.height * 0.8),
        }
      }

      // Extract colors from the detected/assumed strip region
      const results = extractColorsFromRegion(imageData, analyzeRegion, canvas.width)

      resolve({
        ...results,
        processingMethod: aiResult.processingMethod,
        stripDetected: aiResult.stripDetected,
      })
    }

    img.onerror = () => {
      resolve({
        error: "Failed to load image",
        processingMethod: "error",
      })
    }

    img.src = imageUrl
  })
}

function extractColorsFromRegion(imageData: ImageData, region: any, canvasWidth: number) {
  const { x, y, width, height } = region
  const bands = 6 // Assuming 6-parameter test strip
  const bandHeight = Math.floor(height / bands)

  const results: any = {}
  const parameters = ["Free Chlorine", "pH", "Total Alkalinity", "Total Chlorine", "Total Hardness", "Cyanuric Acid"]

  for (let i = 0; i < bands; i++) {
    const bandY = y + i * bandHeight
    const bandCenterY = bandY + Math.floor(bandHeight / 2)

    // Sample colors from the center of each band
    const colors: Array<{ r: number; g: number; b: number }> = []

    // Sample multiple points across the width of the band
    for (let sampleX = x + Math.floor(width * 0.2); sampleX < x + width * 0.8; sampleX += 5) {
      const pixelIndex = (bandCenterY * canvasWidth + sampleX) * 4

      if (pixelIndex < imageData.data.length - 3) {
        const r = imageData.data[pixelIndex]
        const g = imageData.data[pixelIndex + 1]
        const b = imageData.data[pixelIndex + 2]

        // Skip very light colors (likely background)
        if (r + g + b < 700) {
          colors.push({ r, g, b })
        }
      }
    }

    if (colors.length > 0) {
      // Find the most saturated color (likely the test result)
      const dominantColor = colors.reduce((prev, current) => {
        const prevSaturation = Math.max(prev.r, prev.g, prev.b) - Math.min(prev.r, prev.g, prev.b)
        const currentSaturation = Math.max(current.r, current.g, current.b) - Math.min(current.r, current.g, current.b)
        return currentSaturation > prevSaturation ? current : prev
      })

      results[parameters[i]] = {
        value: analyzeColor(dominantColor),
        confidence: Math.min(95, 60 + colors.length),
        status: getParameterStatus(parameters[i], analyzeColor(dominantColor)),
        detectedColor: dominantColor,
      }
    } else {
      // Fallback if no colors detected
      results[parameters[i]] = {
        value: getDefaultValue(parameters[i]),
        confidence: 30,
        status: "unknown",
        detectedColor: { r: 200, g: 200, b: 200 },
      }
    }
  }

  return results
}

function analyzeColor(color: { r: number; g: number; b: number }): number {
  // Enhanced color analysis with better mapping
  const { r, g, b } = color

  // Calculate color properties
  const brightness = (r + g + b) / 3
  const saturation = Math.max(r, g, b) - Math.min(r, g, b)

  // Map colors to values based on common test strip patterns
  if (r > g && r > b) {
    // Red/Orange dominant - often indicates higher values
    return 7.5 + (saturation / 255) * 2
  } else if (g > r && g > b) {
    // Green dominant - often indicates medium values
    return 6.5 + (brightness / 255) * 2
  } else if (b > r && b > g) {
    // Blue dominant - often indicates lower values
    return 6.0 + (brightness / 255) * 1.5
  } else if (r > 200 && g > 150 && b < 100) {
    // Yellow/Orange - common for chlorine
    return 1.0 + (r / 255) * 4
  } else {
    // Default based on brightness
    return 6.0 + (brightness / 255) * 3
  }
}

function getParameterStatus(parameter: string, value: number): string {
  // Define ideal ranges for each parameter
  const ranges: Record<string, { low: number; high: number }> = {
    "Free Chlorine": { low: 1.0, high: 3.0 },
    pH: { low: 7.2, high: 7.6 },
    "Total Alkalinity": { low: 80, high: 120 },
    "Total Chlorine": { low: 1.0, high: 3.0 },
    "Total Hardness": { low: 150, high: 300 },
    "Cyanuric Acid": { low: 30, high: 50 },
  }

  const range = ranges[parameter]
  if (!range) return "unknown"

  if (value < range.low) return "low"
  if (value > range.high) return "high"
  return "ok"
}

function getDefaultValue(parameter: string): number {
  const defaults: Record<string, number> = {
    "Free Chlorine": 2.0,
    pH: 7.4,
    "Total Alkalinity": 100,
    "Total Chlorine": 2.0,
    "Total Hardness": 200,
    "Cyanuric Acid": 40,
  }

  return defaults[parameter] || 0
}
