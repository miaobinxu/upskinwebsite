"use client"

import { useState } from "react"
import Navbar from "./components/navbar"
import Footer from "./components/footer"
import UploadScreen from "./components/upload-screen"
import PreviewScreen from "./components/preview-screen"
import { convertImageToBase64 } from "@/lib/utils"
import { analyzeProduct } from "@/lib/analyzeProduct"
import { useScreenshotStore } from "@/lib/store/analysisStore"
import { useToast } from "@/hooks/use-toast"

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<"upload" | "preview">("upload")
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    mood: "Default",
    skinType: "Random",
    productName: "",
  });
  const { toast } = useToast()

  const setResult = useScreenshotStore((state) => state.setResult)
  const resetResult = useScreenshotStore((state) => state.reset)
  const setImage = useScreenshotStore((state) => state.setImage)

  // const handleGenerate = (image: string, data: typeof formData) => {
  //   setUploadedImage(image)
  //   setFormData(data)
  //   setCurrentScreen("preview")
  // }

  const handleGenerate = async (file: File, data: typeof formData) => {
    if (!file) return
    setLoading(true)
    try {
      const base64Image = await convertImageToBase64(file)

      const { data: result, error } = await analyzeProduct({
        base64Image,
        mood: data.mood as any,
        skinType: data.skinType as any,
        productName: data.productName,
      });

      if (result) {
        setUploadedImage(base64Image)
        setFormData(data);
        const rawContent = result?.choices?.[0]?.message?.content
        if (!rawContent) {
          toast({
            title: "No AI Response",
            description: "The AI did not return any response.",
            variant: "destructive",
          })
        }

        // Step 2: Parse the JSON string safely
        const jsonString = rawContent.trim().replace(/^```json|```$/g, "").trim()

        let parsed;
        try {
          parsed = JSON.parse(jsonString)
        } catch (err) {
          toast({
            title: "Invalid JSON",
            description: "Failed to parse AI response. Please try again.",
            variant: "destructive",
          })
        }
        setResult(parsed);
        setImage(base64Image);
        setCurrentScreen("preview")
      } else {
      }
    } catch (err) {
      toast({
        title: "Unexpected Error",
        description: "An unknown error occurred. Please try again.",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  const handleStartOver = () => {
    setCurrentScreen("upload")
    setUploadedImage(null)
    setFormData({
      mood: "Default",
      skinType: "Random",
      productName: "",
    });
    resetResult()
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F7F7F7" }}>
      <Navbar />
      <main className="flex-1">
        {currentScreen === "upload" ? (
          <UploadScreen onGenerate={handleGenerate} loading={loading} />
        ) : (
          <PreviewScreen formData={formData} onStartOver={handleStartOver} />
        )}
      </main>
      <Footer />
    </div>
  )
}
