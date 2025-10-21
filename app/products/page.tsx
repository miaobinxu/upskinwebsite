'use client'

import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import ProductsUploadScreen from '@/components/products/ProductsUploadScreen'
import ProductsPreviewScreen from '@/components/products/ProductsPreviewScreen'
import { generateProductTextOverlays, analyzeProductForMockup } from '@/lib/generate-products'
import { useProductsStore } from '@/lib/store/productsStore'

export default function ProductsPage() {
    const [currentScreen, setCurrentScreen] = useState<'upload' | 'preview'>('upload')
    const [loading, setLoading] = useState(false)
    const [previewImages, setPreviewImages] = useState<string[]>([])
    const { toast } = useToast()
    const setData = useProductsStore((s) => s.setData)

    const handleGenerate = async () => {
        setLoading(true)
        try {
            // Step 1: Fetch topic from topics_upskin_products
            const topicRes = await fetch('/api/topic-products')
            const topicJson = await topicRes.json()
            const topicTitle = topicJson?.topic?.title

            if (!topicRes.ok || !topicTitle) {
                toast({
                    title: 'Please try again',
                    description: 'Failed to fetch topic',
                    variant: 'destructive',
                })
                return
            }

            // Step 2: Fetch first image from upskin_firstpage_beauty
            const firstImageRes = await fetch('/api/get-images?folder=upskin_firstpage_beauty&count=1')
            const firstImageJson = await firstImageRes.json()
            const firstImage = firstImageJson?.images?.[0]

            if (!firstImageRes.ok || !firstImage) {
                toast({
                    title: 'Please try again',
                    description: 'Failed to fetch first page image',
                    variant: 'destructive',
                })
                return
            }

            // Step 3: Smart product selection based on topic
            // The API will analyze the topic and select appropriate products using tag matching
            const productImagesRes = await fetch('/api/get-product-images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: topicTitle }),
            })
            const productImagesJson = await productImagesRes.json()
            const productImages = productImagesJson?.images

            if (!productImagesRes.ok || !Array.isArray(productImages) || productImages.length === 0) {
                toast({
                    title: 'Please try again',
                    description: productImagesJson?.error || 'Failed to fetch product images',
                    variant: 'destructive',
                })
                return
            }

            console.log(`✅ Selected ${productImages.length} products for: "${topicTitle}"`)
            productImages.forEach((img: any, i: number) => {
                console.log(`   ${i + 1}. ${img.name}`)
            })

            // Step 4: Generate text overlays with vision (AI analyzes product images)
            const { data: response, error } = await generateProductTextOverlays({
                topic: topicTitle,
                productImages,
            })

            const rawContent = response?.choices?.[0]?.message?.content?.trim()
            if (error || !rawContent) {
                throw new Error(error || 'The AI did not return any content')
            }

            const jsonString = rawContent.replace(/^```json/, '').replace(/```$/, '').trim()
            let parsedData: any

            try {
                parsedData = JSON.parse(jsonString)
            } catch (err) {
                console.error('❌ Failed to parse AI response')
                console.error('Raw AI response:', rawContent)
                console.error('Cleaned JSON string:', jsonString)
                console.error('Parse error:', err)
                throw new Error(`Failed to parse AI response: ${err instanceof Error ? err.message : 'Unknown error'}\n\nAI Response: ${jsonString.substring(0, 200)}...`)
            }

            // Step 5: Analyze last product for detailed mockup display
            const lastProductIndex = productImages.length - 1
            const lastProduct = productImages[lastProductIndex]
            
            // Get the last product's rating from the previous AI call to ensure consistency
            const lastProductKey = `Product ${productImages.length}`
            const lastProductRating = parsedData[lastProductKey]
            const isPositive = lastProductRating?.emoji === '✅'
            const previousScore = lastProductRating?.score || 'unknown'
            
            console.log(`📱 Analyzing last product for app mockup: ${lastProduct.name}`)
            console.log(`   Previous rating: ${lastProductRating?.emoji} ${previousScore}`)
            
            const { data: analysisResponse, error: analysisError } = await analyzeProductForMockup({
                topic: topicTitle,
                productImage: lastProduct,
                previousRating: {
                    emoji: lastProductRating?.emoji,
                    score: previousScore,
                    isPositive
                }
            })

            const analysisRawContent = analysisResponse?.choices?.[0]?.message?.content?.trim()
            if (analysisError || !analysisRawContent) {
                console.warn('⚠️ Product analysis failed, will use mock data')
            }

            let productAnalysisData: any = null
            if (analysisRawContent) {
                try {
                    const analysisJsonString = analysisRawContent.replace(/^```json/, '').replace(/```$/, '').trim()
                    productAnalysisData = JSON.parse(analysisJsonString)
                    console.log('✅ Product analysis data:', productAnalysisData)
                } catch (err) {
                    console.warn('⚠️ Failed to parse product analysis, will use mock data')
                }
            }

            // Step 6: Construct final image array
            // [firstImage, ...productImages, firstImage (last for analysis)]
            const finalImages = [
                firstImage, // Image 1: Title page
                ...productImages.map((img: any) => img.url), // Product images
                firstImage, // Last image: Final analysis page
            ]

            // Prepare data for store (dynamically based on number of products)
            const finalData: any = {
                Title: topicTitle,
                'Product Analysis': productAnalysisData, // Product analysis for last page
            }

            // Add all products to data
            Object.keys(parsedData).forEach((key) => {
                finalData[key] = parsedData[key]
            })

            console.log('📦 Final parsed data:', parsedData)
            console.log('📦 Product analysis data:', productAnalysisData)
            console.log('📦 Final data to store:', finalData)

            setPreviewImages(finalImages)
            setData(finalData)
            setCurrentScreen('preview')

        } catch (error: any) {
            console.error('🚨 Unexpected error:', error)
            toast({
                title: 'Generation failed',
                description: error.message || 'Something went wrong. Please try again.',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
            {currentScreen === 'upload' ? (
                <ProductsUploadScreen onGenerate={handleGenerate} loading={loading} />
            ) : (
                <ProductsPreviewScreen images={previewImages} />
            )}
        </div>
    )
} 