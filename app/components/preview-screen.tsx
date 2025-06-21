"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useScreenshotStore } from "@/lib/store/analysisStore"
import { ArrowLeft, Download, Heart, Share2, RotateCcw, Sparkles } from "lucide-react"
import Image from "next/image"
import { ReactElement, JSXElementConstructor, ReactNode, ReactPortal, Key } from "react"
import html2canvas from "html2canvas"
import { useRef } from "react"

interface PreviewScreenProps {
  formData: {
    mood: string
    skinType: string
    productName: string
  }
  onStartOver: () => void
}

export default function PreviewScreen({ formData, onStartOver }: PreviewScreenProps) {
  const result = useScreenshotStore((state) => state.result);
    const image = useScreenshotStore((state) => state.image)
  const previewRef = useRef<HTMLDivElement>(null)
  if (!result) {
    return <p className="text-center text-red-500 font-semibold">No analysis result found.</p>
  }
  const { name, overallScore, fitScore, Ingredients, keyTakeaway } = result


  const handleDownload = async () => {
    if (!previewRef.current) return;

    const canvas = await html2canvas(previewRef.current, {
      useCORS: true,
      backgroundColor: null
    });

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${formData.productName || "product"}-screenshot.png`;
    link.click();
  };


  return (
    <div className="py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="outline"
            onClick={onStartOver}
            className="flex items-center hover:bg-gray-200 gap-2 h-10 sm:h-12 px-4 sm:px-6 rounded-xl border-2 hover:border-[#6D9886] text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden xs:inline">Back to Upload</span>
          </Button>


          <div className="flex items-center space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#F2E7D5] max-w-fit">
            <Sparkles className="h-4 w-4 shrink-0 text-[#6D9886]" />
            <span className="text-xs sm:text-sm font-medium text-[#393E46] truncate">
              Screenshot Generated
            </span>
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Preview Section */}
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <h1 className="text-3xl font-bold mb-2 text-[#393E46]">Your Screenshot is Ready!</h1>
              <p className="text-gray-600">Download your professional skincare analysis screenshot</p>
            </div>

            {/* Mobile Preview */}
            <Card ref={previewRef} className="rounded-xl bg-[#F7F7F7] shadow-md hover:shadow-lg transition-shadow max-w-sm mx-auto lg:mx-0">
              <CardContent className="p-6">
                {/* Mock Mobile Header */}

                {/* Product Image */}
                <div className="relative aspect-square mb-6 rounded-2xl overflow-hidden bg-gray-100">
                  <Image src={image || "/placeholder.svg"} alt="Product" fill className="object-cover" />
                </div>

                {/* Product Title */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-[#393E46]">{formData.productName || name}</h2>
                  <Heart className="h-5 w-5 text-gray-400" />
                </div>

                {/* Scores */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[overallScore, fitScore].map((item, index) => (
                    <div className="flex items-center space-x-2" key={index}>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: index === 0 ? "#6D9886" : "#8B5CF6" }}></div>
                      <div>
                        <p className="text-xs text-gray-500">{item.name}</p>
                        <p className="text-lg font-semibold text-[#393E46]">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Key Ingredients */}
                <div className="mb-6 flex flex-col gap-2">
                  <h3 className="font-semibold mb-3 text-[#393E46]">Key Ingredients</h3>
                  {Ingredients.map((ingredient: { name: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; description: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined }, idx: Key | null | undefined) => (
                    <div className="rounded-xl p-3 bg-[#F2E7D5]" key={idx}>
                      <p className="font-medium text-[#393E46]">{ingredient.name}</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <div className="w-2 h-2 rounded-full bg-[#6D9886]"></div>
                        <span className="text-xs text-gray-600">{ingredient.description}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Key Takeaway */}
                <div className="rounded-xl p-4 bg-[#F2E7D5]">
                  <h3 className="font-semibold mb-2 text-[#393E46]">Key Takeaway</h3>
                  {keyTakeaway.map((point: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined, idx: Key | null | undefined) => (
                    <p key={idx} className="text-sm text-gray-700 leading-relaxed mb-2">
                      {point}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions Section */}
          <div className="space-y-6">
            {/* Download Card */}
            <Card className="rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-6 text-[#393E46]">Download Options</h3>
                <div className="space-y-4">
                  <Button
                    onClick={handleDownload}
                    className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold rounded-xl bg-[#6D9886] text-white flex items-center justify-center hover:bg-[#5e8374]"
                    size="lg"
                  >
                    <Download className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    <span className="text-sm sm:text-base">Download High Quality PNG</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-12 rounded-xl border-2 hover:border-[#6D9886] hover:bg-gray-200 transition-colors"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Screenshot
                  </Button>
                </div>
                <div className="mt-8 p-4 rounded-xl bg-[#F2E7D5]">
                  <h4 className="font-medium mb-2 text-[#393E46]">Generation Details</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Mood: {formData.mood}</p>
                    <p>Skin Type: {formData.skinType}</p>
                    <p>Resolution: 1080x1920px</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reset Card */}
            <Card className="rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h4 className="font-medium mb-4 text-[#393E46]">Need Changes?</h4>
                <Button
                  onClick={onStartOver}
                  variant="outline"
                  className="w-full h-12 hover:bg-gray-200 rounded-xl border-2 hover:border-[#6D9886] transition-colors"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Generate New Screenshot
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  )
}
