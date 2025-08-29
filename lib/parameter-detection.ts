import type { RGB } from "./color-analysis"

export interface DetectedBand {
  x: number
  y: number
  width: number
  height: number
  centerX: number
  centerY: number
  dominantColor: RGB
  confidence: number
}

export interface TestStripDetection {
  bounds: {
    x: number
    y: number
    width: number
    height: number
    angle: number
  }
  bands: DetectedBand[]
  confidence: number
}

// Convert RGB to grayscale
function rgbToGrayscale(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

// Apply Gaussian blur for noise reduction
function gaussianBlur(imageData: ImageData, radius = 1): ImageData {
  const { width, height, data } = imageData
  const output = new ImageData(width, height)

  const kernel = []
  const sigma = radius / 3
  let sum = 0

  // Generate Gaussian kernel
  for (let i = -radius; i <= radius; i++) {
    const value = Math.exp(-(i * i) / (2 * sigma * sigma))
    kernel.push(value)
    sum += value
  }

  // Normalize kernel
  for (let i = 0; i < kernel.length; i++) {
    kernel[i] /= sum
  }

  // Apply horizontal blur
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0

      for (let i = -radius; i <= radius; i++) {
        const px = Math.max(0, Math.min(width - 1, x + i))
        const idx = (y * width + px) * 4
        const weight = kernel[i + radius]

        r += data[idx] * weight
        g += data[idx + 1] * weight
        b += data[idx + 2] * weight
        a += data[idx + 3] * weight
      }

      const outIdx = (y * width + x) * 4
      output.data[outIdx] = r
      output.data[outIdx + 1] = g
      output.data[outIdx + 2] = b
      output.data[outIdx + 3] = a
    }
  }

  return output
}

// Detect edges using Sobel operator
function detectEdges(imageData: ImageData): ImageData {
  const { width, height, data } = imageData
  const output = new ImageData(width, height)

  // Sobel kernels
  const sobelX = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1],
  ]
  const sobelY = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1],
  ]

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0,
        gy = 0

      // Apply Sobel kernels
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4
          const gray = rgbToGrayscale(data[idx], data[idx + 1], data[idx + 2])

          gx += gray * sobelX[ky + 1][kx + 1]
          gy += gray * sobelY[ky + 1][kx + 1]
        }
      }

      const magnitude = Math.sqrt(gx * gx + gy * gy)
      const outIdx = (y * width + x) * 4

      output.data[outIdx] = magnitude
      output.data[outIdx + 1] = magnitude
      output.data[outIdx + 2] = magnitude
      output.data[outIdx + 3] = 255
    }
  }

  return output
}

// Find rectangular contours that could be test strips
function findTestStripContours(
  imageData: ImageData,
): Array<{ x: number; y: number; width: number; height: number; confidence: number }> {
  const { width, height, data } = imageData
  const threshold = 50
  const contours: Array<{ x: number; y: number; width: number; height: number; confidence: number }> = []

  // Simple contour detection - look for rectangular regions with high edge density
  const stepSize = 10
  const minWidth = Math.floor(width * 0.1)
  const minHeight = Math.floor(height * 0.3)
  const maxWidth = Math.floor(width * 0.8)
  const maxHeight = Math.floor(height * 0.9)

  for (let y = 0; y < height - minHeight; y += stepSize) {
    for (let x = 0; x < width - minWidth; x += stepSize) {
      for (let w = minWidth; w <= maxWidth && x + w < width; w += stepSize) {
        for (let h = minHeight; h <= maxHeight && y + h < height; h += stepSize) {
          // Check if this region has good aspect ratio for a test strip
          const aspectRatio = h / w
          if (aspectRatio < 2 || aspectRatio > 8) continue

          // Calculate edge density in this region
          let edgeCount = 0
          let totalPixels = 0

          for (let py = y; py < y + h; py += 2) {
            for (let px = x; px < x + w; px += 2) {
              const idx = (py * width + px) * 4
              if (data[idx] > threshold) edgeCount++
              totalPixels++
            }
          }

          const edgeDensity = edgeCount / totalPixels
          if (edgeDensity > 0.1) {
            contours.push({
              x,
              y,
              width: w,
              height: h,
              confidence: edgeDensity,
            })
          }
        }
      }
    }
  }

  // Sort by confidence and return best candidates
  return contours.sort((a, b) => b.confidence - a.confidence).slice(0, 5)
}

// Detect individual bands within a test strip region
function detectBands(
  imageData: ImageData,
  stripBounds: { x: number; y: number; width: number; height: number },
): DetectedBand[] {
  const bands: DetectedBand[] = []
  const { x: stripX, y: stripY, width: stripWidth, height: stripHeight } = stripBounds

  // Divide the strip into 6 bands (typical for 6-in-1 test strips)
  const bandCount = 6
  const bandHeight = Math.floor(stripHeight / (bandCount + 1)) // Add padding
  const bandWidth = Math.floor(stripWidth * 0.8) // Use 80% of strip width
  const bandStartX = stripX + Math.floor(stripWidth * 0.1) // Center the bands

  for (let i = 0; i < bandCount; i++) {
    const bandY = stripY + Math.floor(stripHeight * 0.1) + i * bandHeight * 1.2

    // Extract dominant color from this band
    const dominantColor = extractDominantColorFromRegion(imageData, bandStartX, bandY, bandWidth, bandHeight)

    // Calculate confidence based on color uniformity
    const confidence = calculateColorUniformity(imageData, bandStartX, bandY, bandWidth, bandHeight, dominantColor)

    bands.push({
      x: bandStartX,
      y: bandY,
      width: bandWidth,
      height: bandHeight,
      centerX: bandStartX + bandWidth / 2,
      centerY: bandY + bandHeight / 2,
      dominantColor,
      confidence,
    })
  }

  return bands
}

// Extract dominant color from a region with better algorithm
function extractDominantColorFromRegion(
  imageData: ImageData,
  x: number,
  y: number,
  width: number,
  height: number,
): RGB {
  const colorCounts = new Map<string, { color: RGB; count: number }>()
  const { data, width: imgWidth, height: imgHeight } = imageData

  // Sample pixels and count colors (with some tolerance)
  for (let py = y; py < y + height && py < imgHeight; py += 2) {
    for (let px = x; px < x + width && px < imgWidth; px += 2) {
      const idx = (py * imgWidth + px) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]

      // Quantize colors to reduce noise
      const qr = Math.floor(r / 16) * 16
      const qg = Math.floor(g / 16) * 16
      const qb = Math.floor(b / 16) * 16

      const colorKey = `${qr},${qg},${qb}`

      if (colorCounts.has(colorKey)) {
        colorCounts.get(colorKey)!.count++
      } else {
        colorCounts.set(colorKey, { color: { r: qr, g: qg, b: qb }, count: 1 })
      }
    }
  }

  // Find most common color
  let maxCount = 0
  let dominantColor: RGB = { r: 255, g: 255, b: 255 }

  for (const { color, count } of colorCounts.values()) {
    if (count > maxCount) {
      maxCount = count
      dominantColor = color
    }
  }

  return dominantColor
}

// Calculate color uniformity within a region
function calculateColorUniformity(
  imageData: ImageData,
  x: number,
  y: number,
  width: number,
  height: number,
  targetColor: RGB,
): number {
  const { data, width: imgWidth, height: imgHeight } = imageData
  let totalPixels = 0
  let similarPixels = 0
  const threshold = 30 // Color similarity threshold

  for (let py = y; py < y + height && py < imgHeight; py += 2) {
    for (let px = x; px < x + width && px < imgWidth; px += 2) {
      const idx = (py * imgWidth + px) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]

      const distance = Math.sqrt(
        Math.pow(r - targetColor.r, 2) + Math.pow(g - targetColor.g, 2) + Math.pow(b - targetColor.b, 2),
      )

      if (distance < threshold) {
        similarPixels++
      }
      totalPixels++
    }
  }

  return totalPixels > 0 ? similarPixels / totalPixels : 0
}

// Main parameter detection function
export async function detectTestStripParameters(imageUrl: string): Promise<TestStripDetection | null> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (!ctx) throw new Error("Could not get canvas context")

        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

        // Step 1: Apply Gaussian blur to reduce noise
        const blurred = gaussianBlur(imageData, 1)

        // Step 2: Detect edges
        const edges = detectEdges(blurred)

        // Step 3: Find potential test strip contours
        const contours = findTestStripContours(edges)

        if (contours.length === 0) {
          resolve(null)
          return
        }

        // Use the best contour as our test strip
        const bestContour = contours[0]

        // Step 4: Detect bands within the test strip
        const bands = detectBands(imageData, bestContour)

        const detection: TestStripDetection = {
          bounds: {
            x: bestContour.x,
            y: bestContour.y,
            width: bestContour.width,
            height: bestContour.height,
            angle: 0, // TODO: Implement angle detection
          },
          bands,
          confidence: bestContour.confidence,
        }

        resolve(detection)
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => {
      reject(new Error("Failed to load image"))
    }

    img.src = imageUrl
  })
}
