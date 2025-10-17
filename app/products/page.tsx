'use client'

import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import ProductsUploadScreen from '@/components/products/ProductsUploadScreen'
import ProductsPreviewScreen from '@/components/products/ProductsPreviewScreen'
import { determineProductStructure, generateProductTextOverlays, analyzeProductForMockup } from '@/lib/generate-products'
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

            // Step 2: Fetch first image from upskin_firstpage_products
            const firstImageRes = await fetch('/api/get-images?folder=upskin_firstpage_products&count=1')
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

            // Step 3: Layer 1 AI - Determine structure
            const { structure, error: structureError } = await determineProductStructure(topicTitle)

            if (structureError || !structure || structure.length !== 4) {
                throw new Error(structureError || 'Failed to determine product structure')
            }

            // Step 4: Fetch product images based on structure
            const productImagesRes = await fetch('/api/get-product-images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ structure }),
            })
            const productImagesJson = await productImagesRes.json()
            const productImages = productImagesJson?.images

            if (!productImagesRes.ok || !Array.isArray(productImages) || productImages.length !== 4) {
                toast({
                    title: 'Please try again',
                    description: 'Failed to fetch product images',
                    variant: 'destructive',
                })
                return
            }

            // Step 5: Layer 2 AI - Generate text overlays with vision
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
                throw new Error('Failed to parse AI response')
            }

            // Step 5.5: Layer 3 AI - Analyze Product 4 for mockup display
            const { data: analysisResponse, error: analysisError } = await analyzeProductForMockup({
                topic: topicTitle,
                productImage: productImages[3], // Product 4 (last product)
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
            // [firstImage, productImage1, productImage2, productImage3, productImage4, firstImage (last)]
            const finalImages = [
                firstImage, // Image 1: Title page
                productImages[0].url, // Image 2: Product 1
                productImages[1].url, // Image 3: Product 2
                productImages[2].url, // Image 4: Product 3
                productImages[3].url, // Image 5: Product 4
                firstImage, // Image 6: Final analysis page (same as first)
            ]

            // Prepare data for store
            const finalData: any = {
                Title: topicTitle,
                'Product 1': parsedData['Product 1'] || '',
                'Product 2': parsedData['Product 2'] || '',
                'Product 3': parsedData['Product 3'] || '',
                'Product 4': parsedData['Product 4'] || '',
                'Product Analysis': productAnalysisData, // Add product analysis data
            }

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