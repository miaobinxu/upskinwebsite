"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X, Sparkles, ImageIcon, Zap } from "lucide-react"
import Image from "next/image"

interface UploadScreenProps {
  onGenerate: (image: string, data: { mood: string; skinType: string; productName: string }) => void
}

export default function UploadScreen({ onGenerate }: UploadScreenProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [mood, setMood] = useState<string>("")
  const [skinType, setSkinType] = useState<string>("")
  const [productName, setProductName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
      setError("Please upload a JPEG, PNG, or WebP image")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string)
      setError(null)
    }
    reader.readAsDataURL(file)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const removeImage = () => {
    setUploadedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleGenerate = () => {
    if (!uploadedImage) {
      setError("Please upload an image first")
      return
    }

    if (!mood || !skinType) {
      setError("Please select all options")
      return
    }

    setError(null)
    onGenerate(uploadedImage, { mood, skinType, productName })
  }

  return (
    <div className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-full mb-6"
            style={{ backgroundColor: "#F2E7D5" }}
          >
            <Sparkles className="h-4 w-4" style={{ color: "#6D9886" }} />
            <span className="text-sm font-medium" style={{ color: "#393E46" }}>
              AI-Powered Screenshot Generator
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: "#393E46" }}>
            Generate Beautiful
            <span className="block" style={{ color: "#6D9886" }}>
              Product Screenshots
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Transform your skincare product images into professional analysis screenshots with our advanced AI
            technology
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start px-4 sm:px-6 lg:px-0">
          {/* Upload Section */}
          <div className="space-y-8">
            <Card
              className="rounded-2xl border-2 shadow-sm"
              style={{ borderColor: uploadedImage ? "#6D9886" : "#e5e7eb" }}
            >
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#F2E7D5]">
                    <ImageIcon className="h-5 w-5" style={{ color: "#6D9886" }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-[#393E46]">Upload Product Image</h3>
                    <p className="text-sm text-gray-600">High-quality images work best</p>
                  </div>
                </div>

                {!uploadedImage ? (
                  <div
                    className={`border-2 border-dashed rounded-2xl cursor-pointer transition-shadow ${isDragging
                        ? "border-[#6D9886] bg-[#F2E7D5]/30 shadow-md"
                        : "border-gray-300 hover:border-[#6D9886] hover:bg-[#F2E7D5]/10"
                      }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="p-8 sm:p-12 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-[#F2E7D5]">
                        <Upload className="h-8 w-8" style={{ color: "#6D9886" }} />
                      </div>
                      <p className="text-gray-700 font-medium mb-2">Click to upload or drag and drop</p>
                      <p className="text-sm text-gray-500">JPEG, PNG, WebP up to 10MB</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 relative">
                      <Image
                        src={uploadedImage || "/placeholder.svg"}
                        alt="Uploaded product"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute -top-3 -right-3 h-10 w-10 rounded-full bg-white border-2 shadow-lg hover:shadow-xl"
                      onClick={removeImage}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </CardContent>
            </Card>
          </div>

          {/* Options Section */}
          <div className="space-y-6">
            <Card className="rounded-2xl border-2 border-gray-200 shadow-sm">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#F2E7D5]">
                    <Zap className="h-5 w-5" style={{ color: "#6D9886" }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-[#393E46]">Customize Analysis</h3>
                    <p className="text-sm text-gray-600">Tailor the analysis to your needs</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Mood */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-[#393E46]">Analysis Mood</Label>
                    <Select value={mood} onValueChange={setMood}>
                      <SelectTrigger className="w-full h-12 rounded-xl border-2 border-[#393E46] focus:border-[#6D9886] shadow-sm">
                        <SelectValue placeholder="Select analysis mood" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-md">
                        <SelectItem value="Default">Default Analysis</SelectItem>
                        <SelectItem value="Positive">Positive Focus</SelectItem>
                        <SelectItem value="Negative">Critical Analysis</SelectItem>
                        <SelectItem value="Positive but not match">Positive with Concerns</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Skin Type */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-[#393E46]">Target Skin Type</Label>
                    <Select value={skinType} onValueChange={setSkinType}>
                      <SelectTrigger className="w-full h-12 rounded-xl border-2 border-[#393E46] focus:border-[#6D9886] shadow-sm">
                        <SelectValue placeholder="Select skin type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-md">
                        <SelectItem value="Random">Random Skin Type</SelectItem>
                        <SelectItem value="Oily">Oily Skin</SelectItem>
                        <SelectItem value="Dry">Dry Skin</SelectItem>
                        <SelectItem value="Combination">Combination Skin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Product Name */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-[#393E46]">Product Name (Optional)</Label>
                    <Input
                      type="text"
                      placeholder="Leave blank to auto-generate"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="w-full h-12 rounded-xl border-2 border-[#393E46] focus:border-[#6D9886] shadow-sm"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mt-6 bg-red-50 border-2 border-red-200 rounded-xl p-4">
                    <p className="text-red-600 text-sm font-medium">{error}</p>
                  </div>
                )}

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={!uploadedImage}
                  className="w-full mt-8 h-14 text-lg font-semibold rounded-xl shadow-md disabled:opacity-50"
                  style={{
                    backgroundColor: uploadedImage ? "#6D9886" : "#d1d5db",
                    color: "white",
                  }}
                  size="lg"
                >
                  <Sparkles className="h-5 w-5 mr-2 text-yellow-400" />
                  Generate Screenshot
                </Button>
              </CardContent>
            </Card>

            {/* Features Section */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-xl shadow-sm bg-[#F2E7D5]">
                <div className="w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center bg-white">
                  <Sparkles className="h-4 w-4 text-yellow-400" />
                </div>
                <p className="text-sm font-medium text-[#393E46]">AI-Powered</p>
              </div>
              <div className="text-center p-4 rounded-xl shadow-sm bg-[#F2E7D5]">
                <div className="w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center bg-white">
                  <Zap className="h-4 w-4 text-[#6D9886]" />
                </div>
                <p className="text-sm font-medium text-[#393E46]">Instant Results</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
