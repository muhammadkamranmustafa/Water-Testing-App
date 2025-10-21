import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get("image") as File

    if (!imageFile) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    // Check if Hugging Face API key is available
    if (!process.env.HUGGINGFACE_API_KEY) {
      console.warn("Hugging Face API key not configured")
      return NextResponse.json({
        stripDetected: false,
        colorBands: [],
        processingMethod: "fallback",
      })
    }

    const hfResponse = await fetch("https://api-inference.huggingface.co/models/facebook/detr-resnet-50", {
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
      },
      method: "POST",
      body: imageFile,
    })

    if (!hfResponse.ok) {
      console.warn(`AI API returned ${hfResponse.status}: ${hfResponse.statusText}`)
      return NextResponse.json({
        stripDetected: false,
        colorBands: [],
        processingMethod: "fallback",
      })
    }

    const result = await hfResponse.json()

    // Handle different response formats
    if (Array.isArray(result) && result.length > 0) {
      const stripObjects = result.filter((obj: any) => obj.score > 0.3 && obj.box)

      if (stripObjects.length > 0) {
        const bestStrip = stripObjects[0]
        return NextResponse.json({
          stripDetected: true,
          stripBounds: {
            x: bestStrip.box.xmin || 0,
            y: bestStrip.box.ymin || 0,
            width: (bestStrip.box.xmax || 100) - (bestStrip.box.xmin || 0),
            height: (bestStrip.box.ymax || 100) - (bestStrip.box.ymin || 0),
          },
          colorBands: [],
          processingMethod: "ai",
        })
      }
    }

    return NextResponse.json({
      stripDetected: false,
      colorBands: [],
      processingMethod: "fallback",
    })
  } catch (error) {
    console.error("AI analysis error:", error)
    return NextResponse.json({
      stripDetected: false,
      colorBands: [],
      processingMethod: "error",
    })
  }
}
