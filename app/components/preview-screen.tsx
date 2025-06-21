"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useScreenshotStore } from "@/lib/store/analysisStore"
import { ArrowLeft, Download, Heart, Share2, RotateCcw, Sparkles, Star, User } from "lucide-react"
import { ReactElement, JSXElementConstructor, ReactNode, ReactPortal, Key, JSX, useState } from "react"
import { toPng } from "html-to-image";
import { useRef } from "react"
import { PiShare } from "react-icons/pi";
import toast from 'react-hot-toast'

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
  const image = useScreenshotStore((state) => state.image);
  const [isDownloading, setIsDownloading] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null)
  if (!result) {
    return <p className="text-center text-red-500 font-semibold">No analysis result found.</p>
  }
  const { name, overallScore, fitScore, Ingredients, keyTakeaway } = result

  const handleDownload = async () => {
    if (!previewRef.current) return;

    setIsDownloading(true);

    try {
      const element = previewRef.current;
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile) {
        toast.error("Screenshot download is only supported on desktop. Please use a desktop browser.");
        return;
      }
      const dataUrl = await toPng(element, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#fff",
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "screenshot.png";
      link.click();

    } catch (err) {
      toast.error("There was an error while generating the screenshot.");
    } finally {
      setIsDownloading(false);
    }
  };

  const getDotColor = (value: number | string) => {
    const score = typeof value === "number" ? value : parseInt(value.toString());
    if (isNaN(score)) return "#000000"; // fallback for non-score values like skin type
    if (score >= 90) return "#2B641A";     // Dark Green
    if (score >= 60) return "#4FBB31";     // Light Green
    if (score >= 30) return "#FE9E1D";     // Orange
    return "#EB4335";                      // Red
  };

  const normalize = (str: string) =>
    str.trim().toLowerCase().replace(/\s+/g, " ");

  const getScoreDescription = (label: string, value: number | string) => {
    const score = typeof value === "number" ? value : parseInt(value.toString());

    const normalizedLabel = normalize(label);

    if (normalizedLabel === "overall score") {
      if (score >= 90) return "Excellent";
      if (score >= 60) return "Good";
      if (score >= 30) return "Poor";
      return "Bad";
    }

    if (normalizedLabel === "compatibility") {
      if (score >= 90) return "Perfect";
      if (score >= 60) return "Good";
      if (score >= 30) return "Minimal";
      return "Mismatch";
    }

    return "";
  };

  type IconType = JSX.Element | string;

  const iconMap: Record<string, IconType> = {
    [normalize("Overall Score")]: '/shield.png',
    [normalize("Your Skin")]: '/skin-type.png',
    [normalize("Compatibility")]: '/compability.png',
  };


  const scoreCards = [overallScore, { name: 'Your Skin', value: formData.skinType }, fitScore].map((item) => ({
    ...item,
    icon: iconMap[normalize(item.name)] || null,
    dotColor: getDotColor(item.value),
    description: getScoreDescription(item.name, item.value),
  }));

  const getIngredientDotColor = (description: string) => {
    const normalized = description.toLowerCase();

    if (normalized.includes("no risk") || normalized.includes("acne safe")) {
      return "#2B641A"; // Dark Green
    }

    if (normalized.includes("low risk")) {
      return "#FFD35E"; // Yellow
    }

    if (normalized.includes("moderate risk")) {
      return "#FE9E1D"; // Orange
    }

    if (normalized.includes("high risk") || normalized.includes("acne risk")) {
      return "#EB4335"; // Red
    }

    return "#2B641A"; // Dark Green
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
            <Card ref={previewRef} className="border-none max-w-sm mx-auto lg:mx-0" style={{
              background: "linear-gradient(to top, #e3ede4 0%, #FFFFFF 100%)",
              fontFamily: "Inter, sans-serif",
            }}>
              <CardContent className="p-6 flex flex-col items-center">
                {/* Mock Mobile Header */}
                <div className="flex items-center w-full justify-between mb-6 pb-4">
                  <div className="p-2 border rounded-full border-gray-200">
                    <ArrowLeft className="h-5 w-5" />
                  </div>
                  <span className="font-semibold text-2xl" style={{ color: "#393E46" }}>
                    UPSKIN
                  </span>
                  <div className="p-2 border rounded-full border-gray-200">
                    <PiShare className="h-5 w-5" />
                  </div>
                </div>

                {/* Product Image */}
                <div className="relative w-full max-w-[180px] aspect-square mb-6 rounded-[8px] overflow-hidden bg-gray-100 mx-auto">
                  <img
                    src={image || "/placeholder.svg"}
                    alt="Product"
                    className="w-full h-full object-cover object-center"
                  />
                </div>

                {/* Product Title */}
                <div className="flex items-start justify-between w-full mb-4" style={{ gap: "8px" }}>
                  <h2 className="text-xl font-bold text-[#393E46] break-words">
                    {formData.productName || name}
                  </h2>
                  <Heart className="h-6 w-6 font-bold mt-1" />
                </div>

                {/* Scores */}
                <div className="grid grid-cols-3 mb-4" style={{ gap: "8px" }}>
                  {scoreCards.map((item, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-[8px] shadow-sm p-3 flex flex-col items-start gap-0"
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        {typeof item.icon === "string" ? (
                          <img src={item.icon} alt="icon" className="w-6 h-6 object-contain" />
                        ) : (
                          item.icon
                        )}
                      </div>
                      <p className="text-xs font-medium mb-1 break-words w-full">
                        {item.name}
                      </p>
                      {/* Text */}
                      <div style={{ color: item.dotColor }} className="text-xs">
                        <p className="font-semibold text-sm">
                          {item.value}
                          {typeof item.value === "number" && item.description ? (
                            <span className="text-xs"> · {item.description}</span>
                          ) : null}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>


                {/* Key Ingredients */}
                <div className="mb-4 flex flex-col w-full" style={{ gap: "8px" }}>
                  <h3 className="font-semibold text-xl mb-3 text-[#393E46]">Ingredients</h3>
                  {Ingredients.map((ingredient: { name: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; description: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined }, idx: Key | null | undefined) => (
                    <div className="rounded-[8px] p-3 bg-[#FFFFFF]" key={idx}>
                      <p className="font-bold text-[#393E46]">{ingredient.name}</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <div
                          className="w-[10px] h-[10px] rounded-full"
                          style={{ backgroundColor: getIngredientDotColor(ingredient.description?.toString() || "") }}
                        ></div>
                        <span className="text-xs text-gray-600">{ingredient.description}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Key Takeaway */}
                <div className="mb-4 flex flex-col w-full" style={{ gap: "8px" }}>
                  <h3 className="font-semibold text-xl mb-3 text-[#393E46]">Key Takeaway</h3>
                  <div className="">
                    {keyTakeaway.map((point: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined, idx: Key | null | undefined) => (
                      <p key={idx} className="text-sm text-gray-700 rounded-[8px] p-2 bg-[#FFFFFF] leading-relaxed mb-2">
                        {point}
                      </p>
                    ))}
                  </div>
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
                    disabled={isDownloading}
                    className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold rounded-xl bg-[#6D9886] text-white flex items-center justify-center hover:bg-[#5e8374] disabled:opacity-60 disabled:cursor-not-allowed"
                    size="lg"
                  >
                    {isDownloading ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8H4z"
                          ></path>
                        </svg>
                        <span className="text-sm sm:text-base">Generating PNG...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        <span className="text-sm sm:text-base">Download High Quality PNG</span>
                      </>
                    )}
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