'use client'

import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import ProductsUploadScreenEs from '@/components/products-es/ProductsUploadScreenEs'
import ProductsPreviewScreenEs from '@/components/products-es/ProductsPreviewScreenEs'
import { determineProductStructure, generateProductTextOverlays, analyzeProductForMockup } from '@/lib/generate-products-es'
import { useProductsStoreEs } from '@/lib/store/productsStoreEs'

export default function ProductsEsPage() {
    const [currentScreen, setCurrentScreen] = useState<'upload' | 'preview'>('upload')
    const [loading, setLoading] = useState(false)
    const [previewImages, setPreviewImages] = useState<string[]>([])
    const { toast } = useToast()
    const setData = useProductsStoreEs((s) => s.setData)

    const handleGenerate = async () => {
        setLoading(true)
        try {
            // Step 1: Fetch topic from topics_upskin_products
            const topicRes = await fetch('/api/topic-products')
            const topicJson = await topicRes.json()
            const topicTitle = topicJson?.topic?.title

            if (!topicRes.ok || !topicTitle) {
                toast({
                    title: 'Por favor intenta de nuevo',
                    description: 'Error al obtener el tema',
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
                    title: 'Por favor intenta de nuevo',
                    description: 'Error al obtener la imagen de primera página',
                    variant: 'destructive',
                })
                return
            }

            // Step 3: Layer 1 AI - Determine structure
            const { structure, error: structureError } = await determineProductStructure(topicTitle)

            if (structureError || !structure || structure.length !== 4) {
                throw new Error(structureError || 'Error al determinar la estructura del producto')
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
                    title: 'Por favor intenta de nuevo',
                    description: 'Error al obtener imágenes de productos',
                    variant: 'destructive',
                })
                return
            }

            // Step 5: Layer 2 AI - Generate text overlays with vision (Spanish)
            const { data: response, error } = await generateProductTextOverlays({
                topic: topicTitle,
                productImages,
            })

            const rawContent = response?.choices?.[0]?.message?.content?.trim()
            if (error || !rawContent) {
                throw new Error(error || 'La IA no devolvió ningún contenido')
            }

            const jsonString = rawContent.replace(/^```json/, '').replace(/```$/, '').trim()
            let parsedData: any

            try {
                parsedData = JSON.parse(jsonString)
            } catch (err) {
                throw new Error('Error al analizar la respuesta de la IA')
            }

            // Use Spanish title from AI response, fallback to original topic if not provided
            const spanishTitle = parsedData['Title'] || topicTitle

            // Step 5.5: Layer 3 AI - Analyze Product 4 for mockup display (Spanish)
            const { data: analysisResponse, error: analysisError } = await analyzeProductForMockup({
                topic: topicTitle,
                productImage: productImages[3], // Product 4 (last product)
            })

            const analysisRawContent = analysisResponse?.choices?.[0]?.message?.content?.trim()
            if (analysisError || !analysisRawContent) {
                console.warn('⚠️ El análisis del producto falló, se usarán datos de prueba')
            }

            let productAnalysisData: any = null
            if (analysisRawContent) {
                try {
                    const analysisJsonString = analysisRawContent.replace(/^```json/, '').replace(/```$/, '').trim()
                    productAnalysisData = JSON.parse(analysisJsonString)
                    console.log('✅ Datos de análisis del producto:', productAnalysisData)
                } catch (err) {
                    console.warn('⚠️ Error al analizar el análisis del producto, se usarán datos de prueba')
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

            // Prepare data for store (use Spanish title from AI)
            const finalData: any = {
                Title: spanishTitle,
                'Product 1': parsedData['Product 1'] || '',
                'Product 2': parsedData['Product 2'] || '',
                'Product 3': parsedData['Product 3'] || '',
                'Product 4': parsedData['Product 4'] || '',
                'Product Analysis': productAnalysisData, // Add product analysis data
            }

            console.log('📦 Datos analizados finales:', parsedData)
            console.log('📦 Datos de análisis del producto:', productAnalysisData)
            console.log('📦 Datos finales para almacenar:', finalData)

            setPreviewImages(finalImages)
            setData(finalData)
            setCurrentScreen('preview')

        } catch (error: any) {
            console.error('🚨 Error inesperado:', error)
            toast({
                title: 'Error de generación',
                description: error.message || 'Algo salió mal. Por favor intenta de nuevo.',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
            {currentScreen === 'upload' ? (
                <ProductsUploadScreenEs onGenerate={handleGenerate} loading={loading} />
            ) : (
                <ProductsPreviewScreenEs images={previewImages} />
            )}
        </div>
    )
}

