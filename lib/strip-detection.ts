export interface StripRegion {
  x: number
  y: number
  width: number
  height: number
  angle: number
}

export interface ColorBand {
  x: number
  y: number
  width: number
  height: number
  color: { r: number; g: number; b: number }
}

// Simple and fast strip detection
export function isolateTestStrip(imageData: ImageData): { stripData: ImageData; region: StripRegion | null } {
  try {
    // Simple approach: assume the strip is in the center area of the image
    const width = imageData.width
    const height = imageData.height

    // Determine if image is likely vertical or horizontal
    const isVertical = height > width

    let region: StripRegion

    if (isVertical) {
      // For vertical images, assume strip is in center vertical area
      region = {
        x: Math.floor(width * 0.2),
        y: Math.floor(height * 0.1),
        width: Math.floor(width * 0.6),
        height: Math.floor(height * 0.8),
        angle: 90,
      }
    } else {
      // For horizontal images, assume strip is in center horizontal area
      region = {
        x: Math.floor(width * 0.1),
        y: Math.floor(height * 0.2),
        width: Math.floor(width * 0.8),
        height: Math.floor(height * 0.6),
        angle: 0,
      }
    }

    // Extract the strip region quickly
    const stripCanvas = document.createElement("canvas")
    const stripCtx = stripCanvas.getContext("2d")
    if (!stripCtx) throw new Error("Could not create strip canvas context")

    stripCanvas.width = region.width
    stripCanvas.height = region.height

    const stripImageData = stripCtx.createImageData(region.width, region.height)

    // Fast pixel copy with bounds checking
    for (let y = 0; y < region.height; y++) {
      for (let x = 0; x < region.width; x++) {
        const srcX = region.x + x
        const srcY = region.y + y

        if (srcX < width && srcY < height) {
          const srcIdx = (srcY * width + srcX) * 4
          const dstIdx = (y * region.width + x) * 4

          stripImageData.data[dstIdx] = imageData.data[srcIdx]
          stripImageData.data[dstIdx + 1] = imageData.data[srcIdx + 1]
          stripImageData.data[dstIdx + 2] = imageData.data[srcIdx + 2]
          stripImageData.data[dstIdx + 3] = imageData.data[srcIdx + 3]
        }
      }
    }

    return { stripData: stripImageData, region }
  } catch (error) {
    console.error("Strip isolation failed:", error)
    return { stripData: imageData, region: null }
  }
}

// Fast color band detection
export function detectColorBands(stripData: ImageData, region: StripRegion): ColorBand[] {
  const bands: ColorBand[] = []
  const isVertical = region.height > region.width

  if (isVertical) {
    // Vertical strip - divide into 6 horizontal bands
    const bandHeight = Math.floor(stripData.height / 8)
    const bandWidth = Math.floor(stripData.width * 0.6)
    const startX = Math.floor(stripData.width * 0.2)

    for (let i = 1; i <= 6; i++) {
      const y = bandHeight * i
      const color = extractFastColor(stripData, startX, y, bandWidth, bandHeight)

      bands.push({
        x: startX,
        y,
        width: bandWidth,
        height: bandHeight,
        color,
      })
    }
  } else {
    // Horizontal strip - divide into 6 vertical bands
    const bandWidth = Math.floor(stripData.width / 8)
    const bandHeight = Math.floor(stripData.height * 0.6)
    const startY = Math.floor(stripData.height * 0.2)

    for (let i = 1; i <= 6; i++) {
      const x = bandWidth * i
      const color = extractFastColor(stripData, x, startY, bandWidth, bandHeight)

      bands.push({
        x,
        y: startY,
        width: bandWidth,
        height: bandHeight,
        color,
      })
    }
  }

  return bands
}

// Fast color extraction - much simpler than before
function extractFastColor(
  imageData: ImageData,
  x: number,
  y: number,
  width: number,
  height: number,
): { r: number; g: number; b: number } {
  let totalR = 0,
    totalG = 0,
    totalB = 0,
    count = 0

  // Sample center area with larger steps for speed
  const centerX = x + Math.floor(width * 0.3)
  const centerY = y + Math.floor(height * 0.3)
  const centerWidth = Math.floor(width * 0.4)
  const centerHeight = Math.floor(height * 0.4)

  const step = 4 // Sample every 4th pixel for speed

  for (let py = centerY; py < centerY + centerHeight; py += step) {
    for (let px = centerX; px < centerX + centerWidth; px += step) {
      if (px >= 0 && px < imageData.width && py >= 0 && py < imageData.height) {
        const idx = (py * imageData.width + px) * 4
        const r = imageData.data[idx]
        const g = imageData.data[idx + 1]
        const b = imageData.data[idx + 2]
        const a = imageData.data[idx + 3]

        // Skip transparent or very light pixels (background)
        if (a > 200 && !(r > 240 && g > 240 && b > 240)) {
          totalR += r
          totalG += g
          totalB += b
          count++
        }
      }
    }
  }

  if (count === 0) {
    return { r: 200, g: 200, b: 200 } // Default gray
  }

  return {
    r: Math.round(totalR / count),
    g: Math.round(totalG / count),
    b: Math.round(totalB / count),
  }
}
