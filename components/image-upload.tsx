"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, Upload, ImageIcon, Smartphone } from "lucide-react"

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void
}

export function ImageUpload({ onImageUpload }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [imageError, setImageError] = useState<Record<number, boolean>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const sampleImages = [
    {
      path: "./test-strip-sample-1.jpg",
      alt: "Test strip with multiple colored bands",
      description: "Multi-parameter strip",
    },
    {
      path: "/test-strip-sample-2.jpg",
      alt: "Vertical test strip with distinct colors",
      description: "Vertical orientation",
    },
    {
      path: "/test-strip-sample-3.jpg",
      alt: "Test strip with orange and yellow bands",
      description: "Clear color bands",
    },
  ]

  const handleFile = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        onImageUpload(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const openCamera = () => {
    cameraInputRef.current?.click()
  }

  const handleImageError = (index: number) => {
    setImageError((prev) => ({ ...prev, [index]: true }))
  }

  const handleImageLoad = (index: number) => {
    setImageError((prev) => ({ ...prev, [index]: false }))
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card
        className={`border-2 border-dashed transition-all duration-200 ${
          dragActive
            ? "border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <CardContent className="p-6 sm:p-8 text-center">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center">
              <ImageIcon className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
            </div>
            <div>
              <p className="text-lg sm:text-xl font-semibold text-gray-900">
                <span className="hidden sm:inline">Drag and drop your test strip image here</span>
                <span className="sm:hidden">Upload your test strip image</span>
              </p>
              <p className="text-sm sm:text-base text-gray-600 mt-2">
                For best results, ensure the test strip is clearly visible and well-lit
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Button
          onClick={openCamera}
          className="h-14 sm:h-12 text-base sm:text-base bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 text-white font-medium"
          size="lg"
        >
          <div className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5 sm:hidden" />
            <Camera className="h-5 w-5 hidden sm:block" />
            <span>Take Photo</span>
          </div>
        </Button>
        <Button
          onClick={openFileDialog}
          variant="outline"
          className="h-14 sm:h-12 text-base sm:text-base border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 bg-transparent"
          size="lg"
        >
          <Upload className="h-5 w-5 mr-2" />
          Upload Image
        </Button>
      </div>

      <div className="mt-6 sm:mt-8">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
          <p className="text-sm sm:text-base font-semibold text-gray-800">Try with sample images:</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {sampleImages.map((sample, index) => (
            <button
              key={index}
              onClick={() => onImageUpload(sample.path)}
              className="relative group bg-white rounded-xl border-2 border-gray-200 hover:border-blue-500 transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md"
            >
              <div className="aspect-[3/4] sm:aspect-[4/3] relative">
                {!imageError[index] ? (
                  <img
                    src={sample.path || "./placeholder.svg"}
                    alt={sample.alt}
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(index)}
                    onLoad={() => handleImageLoad(index)}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">Sample {index + 1}</p>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white text-sm font-medium">{sample.description}</p>
                    <p className="text-white text-xs mt-1">Tap to use</p>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInput} className="hidden" />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInput}
        className="hidden"
      />
    </div>
  )
}
