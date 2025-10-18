'use client'

import { downloadImage } from '@/lib/utils'
import { ChevronRight, Download, ArrowLeft, Heart, Share2 } from 'lucide-react'
import Image from 'next/image'
import { useMemo, useRef, useState } from 'react'
import { Poppins } from 'next/font/google';
import { useProductsStore, ProductAnalysis } from '@/lib/store/productsStore'

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
function extractContentFromFlat(data: Record<string, any>) {
  console.log('🔍 Extracting content from data:', data)
  const contents = []
  let i = 1
  while (data[`Product ${i}`]) {
    const product = data[`Product ${i}`]
    console.log(`🔍 Product ${i}:`, product, 'Type:', typeof product)
    // Support both old format (string) and new format (object with name, emoji, score, points)
    if (typeof product === 'string') {
      contents.push({ text: product })
    } else {
      contents.push({
        name: product.name || '',
        emoji: product.emoji || '✅',
        score: product.score || '',
        points: product.points || []
      })
    }
    i++
  }
  console.log('🔍 Extracted contents:', contents)
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
  const productAnalysis = data?.['Product Analysis']

  const contents = extractContentFromFlat(data ?? {});

  if (!images || images.length === 0) {
    return <div className="text-center text-gray-500">No preview images available.</div>
  }

  // Get Product 4 image (index 4, which is the 5th image) for the mockup product display
  const product4Image = images.length >= 5 ? images[4] : undefined;

  // Build description text from product data
  const buildDescription = () => {
    let description = 'All analysis by UpSkin.\n'
    
    // Add each product with name, score, and first bullet point
    contents.forEach((content, index) => {
      const productNum = index + 1
      
      if (typeof content === 'object' && 'emoji' in content && 'score' in content && 'points' in content) {
        const productName = (content as any).name || `Product ${productNum}`
        const firstPoint = content.points?.[0] || ''
        description += `${productName} - ${content.score}\n`
        if (firstPoint) {
          description += `- ${firstPoint}\n`
        }
      }
    })
    
    description += '#skincare #beauty #glassskin #SkinCareTips #SkinCareRoutine'
    
    return description
  }

  const finalDescription = buildDescription()

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
                productImage={product4Image}
                productAnalysis={productAnalysis}
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
                downloadIndex={sequentialIndex}
              />
            )
          }

          // Case 3: Last image = final page (internal design) with Product 4 image
          if (isLast) {
            return (
              <ProductAnalysisPage
                key={`final-${index}`}
                image={img}
                title={title}
                downloadIndex={sequentialIndex}
                productImage={product4Image}
                productAnalysis={productAnalysis}
              />
            )
          }

          // Case 4: Middle images = content pages
          const content = contents[index - 1] // shift because first image is title
          console.log(`🔍 Rendering content page ${index}, content:`, content)
          return (
            <ContentPage
              key={`content-${index}`}
              image={img}
              content={content || ''}
              downloadIndex={sequentialIndex}
            />
          )
        })}
      </div>
      
      {/* Description Section */}
      <div className="space-y-2 flex flex-col items-center mt-6">
        <p className="text-gray-700 text-md whitespace-pre-line max-w-2xl">
          {finalDescription}
        </p>
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
  downloadIndex?: string
}

interface ContentPageProps {
  image: File | string
  content: string | {
    emoji?: string
    score?: string
    points?: string[]
    text?: string
  }
  downloadIndex?: string
}

interface ProductAnalysisPageProps {
  image?: File | string
  title?: string
  downloadIndex?: string
  productImage?: string  // Product 4的图片，用于mockup中的产品位置
  productAnalysis?: any  // AI分析的产品数据
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

/* ------------------- Content Page Component (Product Overlay) ------------------- */
function ContentPage({ image, content, downloadIndex }: ContentPageProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Parse content into displayable format
  let displayContent: { emoji: string; score: string; points: string[] } | string
  
  if (typeof content === 'string') {
    displayContent = content
  } else if (content && typeof content === 'object' && 'emoji' in content) {
    displayContent = {
      emoji: content.emoji || '✅',
      score: content.score || '',
      points: content.points || []
    }
  } else if (content && typeof content === 'object' && 'text' in content) {
    displayContent = content.text || ''
  } else {
    displayContent = ''
  }

  const isNewFormat = typeof displayContent === 'object'

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
          alt="Product Page"
        />

        {/* Text overlay positioned on the right side */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {isNewFormat && typeof displayContent === 'object' ? (
            // New format: emoji + score + bullet points with individual text backgrounds
            <div className="text-black max-w-[220px] flex flex-col gap-2">
              {/* Emoji + Score */}
              <div className="text-2xl font-bold">
                <span 
                  className="bg-white px-3 py-1 shadow-lg"
                  style={{
                    display: 'inline',
                    boxDecorationBreak: 'clone',
                    WebkitBoxDecorationBreak: 'clone'
                  }}
                >
                  {displayContent.emoji} {displayContent.score}
                </span>
              </div>
              {/* Bullet Points */}
              <ul className="space-y-2 text-xs leading-tight">
                {displayContent.points.map((point: string, idx: number) => (
                  <li key={idx} className="flex items-start">
                    <span className="bg-white px-2 py-1 shadow-md" style={{
                      display: 'inline',
                      boxDecorationBreak: 'clone',
                      WebkitBoxDecorationBreak: 'clone'
                    }}>
                      • {point}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            // Old format: simple text
            <div className="text-lg font-semibold leading-snug max-w-[200px]">
              <span
                className="bg-white text-black px-4 py-2 shadow-lg"
                style={{
                  display: 'inline',
                  boxDecorationBreak: 'clone',
                  WebkitBoxDecorationBreak: 'clone'
                }}
              >
                {typeof displayContent === 'string' ? displayContent : ''}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------ Product Analysis Page Component (Internal Design) ------------------ */
/* ------------------ Product Analysis Page Component (Internal Design) ------------------ */
function ProductAnalysisPage({ image, title, downloadIndex, productImage, productAnalysis }: ProductAnalysisPageProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Use AI-analyzed data if available, otherwise use mock data
  const mockProduct = {
    name: "Lamer Cream",
    overallScore: 94,
    skinType: "Oily",
    compatibility: 94,
    ingredients: [
      { name: "Sea Kelp", description: "Hydrate your skin" },
      { name: "Lime Tea Extract", description: "Soothe redness" }
    ],
    keyTakeaway: [
      "Lamer is highly compatible with oily skin, providing essential hydration without clogging pores.",
      "Sea Kelp is a key ingredient that helps maintain moisture balance, making it ideal for oily skin types."
    ]
  }

  // Use real data if available
  const productData = productAnalysis || mockProduct
  const displayProduct = {
    name: productData.name || mockProduct.name,
    overallScore: { name: "Overall Score", value: productData.overallScore || mockProduct.overallScore },
    skinType: productData.skinType || mockProduct.skinType,
    compatibility: { name: "Compatibility", value: productData.compatibility || mockProduct.compatibility },
    ingredients: productData.ingredients || mockProduct.ingredients,
    keyTakeaway: productData.keyTakeaway || mockProduct.keyTakeaway
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
        height: '800px', // Increased from 600px to accommodate full content
      }}>
        <Image
          src={getImageSrc(image ?? '')}
          fill
          className="object-cover"
          alt="Product Analysis"
        />

        {/* Mobile App Preview Overlay - Adjusted positioning and scale */}
        <div className={`w-[380px] scale-[0.65] absolute z-30 ${poppins.className}`} style={{ 
          top: `-20px`, // Shifted up to prevent bottom cutoff
          left: `15px`, // Moved left to reduce overlap
        }}>
          {/* Download App CTA - moved to center-left */}
          <div className="absolute scale-[1.05] flex left-[80px] -top-32 flex-col z-40 items-center space-y-2 text-center text-[11px] text-white">
            <div className='border border-green-600 rounded-full ring-offset-4 ring-green-600 text-green-600 p-2'>
              <div className="bg-green-100 text-green-600 py-1 px-10 flex items-center justify-center text-center w-80 rounded-full text-[24px] font-semibold">
                Download "UpSkin" App
              </div>
            </div>
          </div>

          {/* Analyze products CTA - moved down and right */}
          <div className="absolute scale-[1.05] flex left-[280px] top-10 flex-col z-40 items-end space-y-2 text-right text-[11px] text-white">
            <div className="bg-green-100 text-green-600 relative p-3 mr-1 flex items-center border-[3px] border-green-600 justify-center text-start w-64 rounded-2xl text-[18px] font-semibold">
              Find what works for YOUR skin!
              <img src={'/charmchat/crown.png'} className='w-24 h-12 rotate-[12deg] scale-50 absolute -top-8 -right-9' />
            </div>
          </div>

          {/* Card matching internal exactly - increased width */}
          <div className="border-none max-w-md mx-auto" style={{
            background: "linear-gradient(to top, #e3ede4 0%, #FFFFFF 100%)",
            fontFamily: "Inter, sans-serif",
          }}>
            <div className="pt-1 px-8 pb-6 flex flex-col items-center">
              {/* Mock Mobile Header */}
              <div className="flex items-center w-full justify-between mb-1 pb-1">
                <div className="p-2 border rounded-full border-gray-200">
                  <ArrowLeft className="h-5 w-5" />
                </div>
                <span className="font-semibold text-2xl" style={{ color: "#393E46", fontFamily: "Cormorant SC" }}>
                  UPSKIN APP
                </span>
                <div className="p-2 border rounded-full border-gray-200">
                  <PiShare className="h-5 w-5" />
                </div>
              </div>

              {/* Product Image */}
              <div className="relative w-full max-w-[220px] aspect-square mb-6 rounded-[8px] overflow-hidden bg-gray-100 mx-auto">
                {productImage ? (
                  <Image
                    src={productImage}
                    fill
                    className="object-cover"
                    alt="Product"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <span className="text-sm text-blue-800 font-medium">Product</span>
                  </div>
                )}
              </div>

              {/* Product Title */}
              <div className="flex items-center justify-between w-full mb-4" style={{ gap: "8px" }}>
                <h2 className="text-xl font-bold w-[90%] text-[#393E46] break-words">
                  {displayProduct.name}
                </h2>
                <Heart className="h-6 w-6 font-bold flex-shrink-0" />
              </div>

              {/* Scores - adjusted grid and card sizing */}
              <div className="grid grid-cols-3 mb-4 w-full" style={{ gap: "10px" }}>
                {[
                  { ...displayProduct.overallScore, icon: '/internal/shield.png', dotColor: getDotColor(displayProduct.overallScore.value), description: getScoreDescription(displayProduct.overallScore.value) },
                  { name: 'Your Skin', value: displayProduct.skinType, icon: '/internal/skin-type.png', dotColor: '#393E46', description: null },
                  { ...displayProduct.compatibility, icon: '/internal/compability.png', dotColor: getDotColor(displayProduct.compatibility.value), description: getScoreDescription(displayProduct.compatibility.value) }
                ].map((item, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-[8px] shadow-sm p-3 flex flex-col items-start gap-0 min-w-[100px]"
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <img src={item.icon} alt="icon" className="w-6 h-6 object-contain" />
                    </div>
                    <p className="text-xs font-medium mb-1 w-full whitespace-nowrap">
                      {item.name}
                    </p>
                    <div style={{ color: item.dotColor }} className="text-xs">
                      <p className="font-semibold text-sm">
                        {item.value}
                        {typeof item.value === "number" && item.description ? (
                          <span className="text-xs block">{item.description}</span>
                        ) : null}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Key Ingredients */}
              <div className="mb-4 flex flex-col w-full" style={{ gap: "8px" }}>
                <h3 className="font-semibold text-lg mb-3 text-[#393E46]">Ingredients</h3>
                {displayProduct.ingredients.map((ingredient: any, idx: number) => (
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
                  {displayProduct.keyTakeaway.map((point: string, idx: number) => (
                    <p key={idx} className="text-sm text-gray-700 rounded-[8px] p-3 bg-[#FFFFFF] leading-relaxed mb-2">
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