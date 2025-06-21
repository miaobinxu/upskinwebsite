"use client"

import { useState } from "react"
import Navbar from "./components/navbar"
import Footer from "./components/footer"
import UploadScreen from "./components/upload-screen"
import PreviewScreen from "./components/preview-screen"

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<"upload" | "preview">("upload")
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    mood: "Default",
    skinType: "Random",
    productName: "",
  })

  const handleGenerate = (image: string, data: typeof formData) => {
    setUploadedImage(image)
    setFormData(data)
    setCurrentScreen("preview")
  }

  const handleStartOver = () => {
    setCurrentScreen("upload")
    setUploadedImage(null)
    setFormData({
      mood: "Default",
      skinType: "Random",
      productName: "",
    })
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F7F7F7" }}>
      <Navbar />
      <main className="flex-1">
        {currentScreen === "upload" ? (
          <UploadScreen onGenerate={handleGenerate} />
        ) : (
          <PreviewScreen image={uploadedImage!} formData={formData} onStartOver={handleStartOver} />
        )}
      </main>
      <Footer />
    </div>
  )
}
