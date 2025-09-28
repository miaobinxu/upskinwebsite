'use client'

import { downloadImage } from '@/lib/utils'
import { ChevronRight, Download, ArrowLeft, Heart, Share2 } from 'lucide-react'
import Image from 'next/image'
import { useMemo, useRef, useState } from 'react'
import { Poppins } from 'next/font/google';
import { useProductsStore } from '@/lib/store/productsStore'

import { PiShare } from "react-icons/pi";
import { DownloadButton } from './DownloadButton'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

interface ProductsPreviewScreenProps {
  images: string[]
}

/* ---------------------------- Message Extractor --------------------------- */
function extractContentFromFlat(data: Record<string, string>) {
  const contents = []
  let i = 1
  while (data[`Content Message ${i}`]) {
    contents.push({
      text: data[`Content Message ${i}`],
    })
    i++
  }
  return contents
}

/* ---------------------------- Helper Function --------------------------- */
function addArrowSuffix(text: string): string {
  const trimmed = text.trim()
  if (trimmed.endsWith('.')) {
    return trimmed.slice(0, -1) + ' >>>'
  }
  return trimmed + ' >>>'
}

/* ---------------------------- 🔥 MAIN COMPONENT --------------------------- */
export default function ProductsPreviewScreen({ images }: ProductsPreviewScreenProps) {
  const data = useProductsStore(state => state.data);
  const title = data?.['Title'] ?? ''
  const subtitle = addArrowSuffix(data?.['Subtitle'] ?? '')
  const tone = data?.['Tone'] ?? ''
  const prompt = data?.['Message Prompt'] ?? ''

  const contents = extractContentFromFlat(data ?? {});

  if (!images || images.length === 0) {
    return <div className="text-center text-gray-500">No preview images available.</div>
  }

  return (
    <div className='flex flex-col p-4'>
      <div className="grid grid-cols-1 place-items-center w-full">
        {images.map((img, index) => {
          const isFirst = index === 0
          const isLast = index === images.length - 1
          const isOnlyOne = images.length === 1

          // Format index as two digits (01, 02, 03, etc.)
          const sequentialIndex = String(index + 1).padStart(2, '0');

          // Case 1: Only one image → show only final page (internal design)
          if (isOnlyOne) {
            return (
              <ProductAnalysisPage
                key={`final-${index}`}
                image={img}
                title={title}
                downloadIndex={sequentialIndex}
              />
            )
          }

          // Case 2: First image = title page
          if (isFirst) {
            return (
              <TitlePage
                key={`title-${index}`}
                image={img}
                title={title}
                subtitle={subtitle}
                downloadIndex={sequentialIndex}
              />
            )
          }

          // Case 3: Last image = final page (internal design)
          if (isLast) {
            return (
              <ProductAnalysisPage
                key={`final-${index}`}
                image={img}
                title={title}
                downloadIndex={sequentialIndex}
              />
            )
          }

          // Case 4: Middle images = content pages
          const content = contents[index - 1] // shift because first image is title
          return (
            <ContentPage
              key={`content-${index}`}
              image={img}
              content={content?.text || ''}
              downloadIndex={sequentialIndex}
            />
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------- Utility -------------------------- */
function getImageSrc(image: File | string): string {
  return typeof image === 'string' ? image : URL.createObjectURL(image)
}

interface TitlePageProps {
  image: File | string
  title: string
  subtitle: string
  downloadIndex?: string
}

interface ContentPageProps {
  image: File | string
  content: string
  downloadIndex?: string
}

interface ProductAnalysisPageProps {
  image?: File | string
  title?: string
  downloadIndex?: string
}

/* --------------------- Title Page Component --------------------- */
function TitlePage({ image, title, downloadIndex }: TitlePageProps) {
  const ref = useRef<HTMLDivElement>(null)

  return (
    <div className="scale-[0.65] sm:scale-[0.9] md:scale-[0.6] lg:scale-[0.8] overflow-hidden shadow-md">
      <DownloadButton refEl={ref} filename={`${downloadIndex || '01'}.png`} />
      <div ref={ref}
        onClick={() => downloadImage(ref, `${downloadIndex || '01'}.png`)}
        className="relative cursor-pointer" style={{
          width: '450px',
          height: '600px',
        }}>
        <Image
          src={getImageSrc(image ?? '')}
          fill
          className="object-cover"
          alt="Title Page"
        />

        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-black text-center gap-8">
          {/* Title */}
          <div className="text-xl font-bold leading-snug max-w-xs">
            <span
              className="bg-white text-black px-3 py-1"
              style={{
                display: 'inline',
                boxDecorationBreak: 'clone',
                WebkitBoxDecorationBreak: 'clone'
              }}
            >
              {title}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------- Content Page Component ------------------- */
function ContentPage({ image, content, downloadIndex }: ContentPageProps) {
  const ref = useRef<HTMLDivElement>(null)

  return (
    <div className="scale-[0.65] sm:scale-[0.9] md:scale-[0.6] lg:scale-[0.8] overflow-hidden shadow-md">
      <DownloadButton refEl={ref} filename={`${downloadIndex || '01'}.png`} />
      <div ref={ref} 
      onClick={() => downloadImage(ref, `${downloadIndex || '01'}.png`)}
      className="relative cursor-pointer" style={{
        width: '450px',
        height: '600px',
      }}>
        <Image
          src={getImageSrc(image)}
          fill
          className="object-cover"
          alt="Content Page"
        />

        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-black text-center gap-8">
          {/* Content */}
          <div className="text-lg font-medium leading-snug max-w-xs">
            <span
              className="bg-white text-black px-3 py-1"
              style={{
                display: 'inline',
                boxDecorationBreak: 'clone',
                WebkitBoxDecorationBreak: 'clone'
              }}
            >
              {content}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------ Product Analysis Page Component (Internal Design) ------------------ */
function ProductAnalysisPage({ image, title, downloadIndex }: ProductAnalysisPageProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Mock data for the product analysis (similar to internal preview screen)
  const mockProduct = {
    name: "Lamer Cream",
    overallScore: { name: "Overall Score", value: 94 },
    skinType: "Oily",
    compatibility: { name: "Compatibility", value: 94 },
    ingredients: [
      { name: "Sea Kelp", description: "Hydrate your skin" },
      { name: "Lime Tea Extract", description: "Soothe redness" }
    ],
    keyTakeaway: [
      "Lamer is highly compatible with oily skin, providing essential hydration without clogging pores.",
      "Sea Kelp is a key ingredient that helps maintain moisture balance, making it ideal for oily skin types."
    ]
  }

  const getDotColor = (value: number) => {
    if (value >= 90) return "#2B641A";     // Dark Green
    if (value >= 60) return "#4FBB31";     // Light Green
    if (value >= 30) return "#FE9E1D";     // Orange
    return "#EB4335";                      // Red
  };

  const getScoreDescription = (value: number) => {
    if (value >= 90) return "Excellent";
    if (value >= 60) return "Good";
    if (value >= 30) return "Poor";
    return "Bad";
  };

  return (
    <div className={`scale-[0.65] sm:scale-[0.9] md:scale-[0.6] lg:scale-[0.8] overflow-hidden shadow-md ${poppins.className}`}>
      <DownloadButton refEl={ref} filename={`${downloadIndex || '01'}.png`} />
      <div ref={ref}
      onClick={() => downloadImage(ref, `${downloadIndex || '01'}.png`)}
      className="relative cursor-pointer" style={{
        width: '450px',
        height: '600px',
      }}>
        <Image
          src={getImageSrc(image ?? '')}
          fill
          className="object-cover"
          alt="Product Analysis"
        />

        {/* Mobile App Preview Overlay - Exact Copy from Internal */}
        <div className={`w-[308px] scale-[0.60] absolute z-30 ${poppins.className}`} style={{ 
          top: `-10px`,
          left: `30px`,
        }}>
          <div className="absolute scale-[1.05] flex left-[200px] -top-36 flex-col z-40 items-end space-y-2 text-right text-[11px] text-white">
            <div className='border border-green-600 rounded-full ring-offset-4 ring-green-600 text-green-600 p-2'>
              <div className="bg-green-100 text-green-600 py-1 px-10 flex items-center justify-center text-center w-80 rounded-full text-[24px] font-semibold">
                Download "UpSkin" App
              </div>
            </div>
            <div className="bg-green-100 text-green-600 relative p-3 mr-1 flex items-center border-[3px] border-green-600 justify-center text-start w-64 rounded-2xl text-[18px] font-semibold">
              Analyze your skincare products instantly.
              <img src={'/internal/upskin-logo.png'} className='w-12 h-12 rotate-[12deg] scale-50 absolute -top-6 -right-9' />
            </div>
          </div>

          {/* Card matching internal exactly */}
          <div className="border-none max-w-sm mx-auto" style={{
            background: "linear-gradient(to top, #e3ede4 0%, #FFFFFF 100%)",
            fontFamily: "Inter, sans-serif",
          }}>
            <div className="pt-1 px-6 pb-6 flex flex-col items-center">
              {/* Mock Mobile Header */}
              <div className="flex items-center w-full justify-between mb-1 pb-1">
                <div className="p-2 border rounded-full border-gray-200">
                  <ArrowLeft className="h-5 w-5" />
                </div>
                <span className="font-semibold text-2xl" style={{ color: "#393E46", fontFamily: "Cormorant SC" }}>
                  APP
                </span>
                <div className="p-2 border rounded-full border-gray-200">
                  <PiShare className="h-5 w-5" />
                </div>
              </div>

              {/* Product Image */}
              <div className="relative w-full max-w-[180px] aspect-square mb-6 rounded-[8px] overflow-hidden bg-gray-100 mx-auto">
                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <span className="text-sm text-blue-800 font-medium">Product</span>
                </div>
              </div>

              {/* Product Title */}
              <div className="flex items-center justify-between w-full mb-4" style={{ gap: "8px" }}>
                <h2 className="text-xl font-bold w-[90%] text-[#393E46] break-words">
                  {mockProduct.name}
                </h2>
                <Heart className="h-6 w-6 font-bold flex-shrink-0" />
              </div>

              {/* Scores */}
              <div className="grid grid-cols-3 mb-4" style={{ gap: "8px" }}>
                {[
                  { ...mockProduct.overallScore, icon: '/internal/shield.png', dotColor: getDotColor(mockProduct.overallScore.value), description: getScoreDescription(mockProduct.overallScore.value) },
                  { name: 'Your Skin', value: mockProduct.skinType, icon: '/internal/skin-type.png', dotColor: '#393E46', description: null },
                  { ...mockProduct.compatibility, icon: '/internal/compability.png', dotColor: getDotColor(mockProduct.compatibility.value), description: getScoreDescription(mockProduct.compatibility.value) }
                ].map((item, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-[8px] shadow-sm p-3 flex flex-col items-start gap-0"
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <img src={item.icon} alt="icon" className="w-6 h-6 object-contain" />
                    </div>
                    <p className="text-xs font-medium mb-1 break-words w-full">
                      {item.name}
                    </p>
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
                <h3 className="font-semibold text-lg mb-3 text-[#393E46]">Ingredients</h3>
                {mockProduct.ingredients.map((ingredient, idx) => (
                  <div className="rounded-[8px] p-3 bg-[#FFFFFF]" key={idx}>
                    <p className="font-bold text-[#393E46]">{ingredient.name}</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <div
                        className="w-[10px] h-[10px] rounded-full"
                        style={{ backgroundColor: "#2B641A" }}
                      ></div>
                      <span className="text-xs text-gray-600">{ingredient.description}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Key Takeaway */}
              <div className="mb-4 flex flex-col w-full" style={{ gap: "8px" }}>
                <h3 className="font-semibold text-lg mb-3 text-[#393E46]">Key Takeaway</h3>
                <div className="">
                  {mockProduct.keyTakeaway.map((point, idx) => (
                    <p key={idx} className="text-sm text-gray-700 rounded-[8px] p-2 bg-[#FFFFFF] leading-relaxed mb-2">
                      {point}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 