"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useScreenshotStore } from "@/lib/store/analysisStore"
import { ArrowLeft, Download, Heart, Share2, RotateCcw, Sparkles, Star, User } from "lucide-react"
import { ReactElement, JSXElementConstructor, ReactNode, ReactPortal, Key, JSX, useState } from "react"
import { toPng } from "html-to-image";
import html2canvas from "html2canvas";
import { useRef } from "react"
import { PiShare } from "react-icons/pi";
import { RiShieldCheckFill } from "react-icons/ri";
import { useToast } from "@/hooks/use-toast"

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
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast()
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
        toast({
          title: "Unsupported on Mobile",
          description: "Screenshot download is only supported on desktop browsers. Please switch to a desktop device.",
          variant: "destructive",
        });
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
      console.error("Image generation failed", err);
      toast({
        title: "Image Generation Failed",
        description: "There was an error while generating the screenshot.",
        variant: "destructive",
      });
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
      return "Incompatible";
    }
    return "";
  };

  type IconType = JSX.Element | string;

  const iconMap: Record<string, IconType> = {
    [normalize("Overall Score")]: '/shield.png',
    [normalize("Skin Type")]: '/skin-type.png',
    [normalize("Compatibility")]: '/compability.png',
  };


  const scoreCards = [overallScore, { name: 'Skin Type', value: formData.skinType }, fitScore].map((item) => ({
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

    return "#8B5CF6"; // Fallback purple
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
            <Card
              ref={previewRef}
              style={{
                border: "none",
                maxWidth: "24rem",
                margin: "0 auto",
                background: "linear-gradient(to top, #e3ede4 0%, #FFFFFF 100%)",
                fontFamily: "Inter, sans-serif",
              }}
            >
              <CardContent
                style={{
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    justifyContent: "space-between",
                    marginBottom: "1.5rem",
                    paddingBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      padding: "0.5rem",
                      border: "1px solid #E5E7EB",
                      borderRadius: "9999px",
                    }}
                  >
                    <ArrowLeft style={{ width: "1.25rem", height: "1.25rem" }} />
                  </div>
                  <span style={{ fontWeight: 600, fontSize: "1.5rem", color: "#393E46" }}>
                    UPSKIN
                  </span>
                  <div
                    style={{
                      padding: "0.5rem",
                      border: "1px solid #E5E7EB",
                      borderRadius: "9999px",
                    }}
                  >
                    <PiShare style={{ width: "1.25rem", height: "1.25rem" }} />
                  </div>
                </div>

                {/* Product Image */}
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    maxWidth: "240px",
                    aspectRatio: "1 / 1",
                    marginBottom: "1.5rem",
                    borderRadius: "8px",
                    overflow: "hidden",
                    background: "#f3f4f6",
                  }}
                >
                  <img
                    src={image || "/placeholder.svg"}
                    alt="Product"
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
                  />
                </div>

                {/* Product Title */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    width: "100%",
                    marginBottom: "1rem",
                    gap: "8px",
                  }}
                >
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#393E46", wordBreak: "break-word" }}>
                    {formData.productName || name}
                  </h2>
                  <Heart style={{ width: "1.5rem", height: "1.5rem", marginTop: "0.25rem" }} />
                </div>

                {/* Score Cards */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "8px",
                    marginBottom: "1rem",
                    width: "100%",
                  }}
                >
                  {scoreCards.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        background: "#FFFFFF",
                        borderRadius: "8px",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                        padding: "0.75rem",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          width: "100%",
                          marginBottom: "0.5rem",
                        }}
                      >
                        {typeof item.icon === "string" ? (
                          <img src={item.icon} alt="icon" style={{ width: "1.5rem", height: "1.5rem" }} />
                        ) : (
                          item.icon
                        )}
                      </div>
                      <p style={{ fontSize: "0.75rem", fontWeight: 500, marginBottom: "0.25rem", wordBreak: "break-word", width: "100%" }}>
                        {item.name}
                      </p>
                      <div style={{ fontSize: "0.75rem", color: item.dotColor }}>
                        <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                          {item.value}
                          {typeof item.value === "number" && item.description ? (
                            <span style={{ fontSize: "0.75rem" }}> · {item.description}</span>
                          ) : null}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Ingredients */}
                <div style={{ marginBottom: "1rem", width: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <h3 style={{ fontWeight: 600, fontSize: "1.25rem", marginBottom: "0.75rem", color: "#393E46" }}>Key Ingredients</h3>
                  {Ingredients.map((ingredient, idx) => (
                    <div key={idx} style={{ borderRadius: "8px", padding: "0.75rem", background: "#FFFFFF" }}>
                      <p style={{ fontWeight: 700, color: "#393E46" }}>{ingredient.name}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.25rem" }}>
                        <div style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "9999px",
                          backgroundColor: getIngredientDotColor(ingredient.description?.toString() || ""),
                        }}></div>
                        <span style={{ fontSize: "0.75rem", color: "#4B5563" }}>{ingredient.description}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Key Takeaway */}
                <div style={{ marginBottom: "1rem", width: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <h3 style={{ fontWeight: 600, fontSize: "1.25rem", marginBottom: "0.75rem", color: "#393E46" }}>Key Takeaway</h3>
                  <div>
                    {keyTakeaway.map((point, idx) => (
                      <p
                        key={idx}
                        style={{
                          fontSize: "0.875rem",
                          color: "#374151",
                          borderRadius: "8px",
                          padding: "0.5rem",
                          background: "#FFFFFF",
                          lineHeight: "1.6",
                          marginBottom: "0.5rem",
                        }}
                      >
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
