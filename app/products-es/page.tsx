'use client'

import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import ProductsUploadScreenEs from '@/components/products-es/ProductsUploadScreenEs'
import ProductsPreviewScreenEs from '@/components/products-es/ProductsPreviewScreenEs'
import { generateProductTextOverlays, analyzeProductForMockup } from '@/lib/generate-products-es'
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

            // Step 2: Fetch first image from upskin_firstpage_beauty
            const firstImageRes = await fetch('/api/get-images?folder=upskin_firstpage_beauty&count=1')
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

            // Step 2.5: Fetch last image from upskin_firstpage_products
            const lastImageRes = await fetch('/api/get-images?folder=upskin_firstpage_products&count=1')
            const lastImageJson = await lastImageRes.json()
            const lastImage = lastImageJson?.images?.[0]

            if (!lastImageRes.ok || !lastImage) {
                toast({
                    title: 'Por favor intenta de nuevo',
                    description: 'Error al obtener la imagen de última página',
                    variant: 'destructive',
                })
                return
            }

            // Step 3: Selección inteligente de productos basada en el tema
            // La API analizará el tema y seleccionará productos apropiados usando coincidencia de etiquetas
            const productImagesRes = await fetch('/api/get-product-images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: topicTitle }),
            })
            const productImagesJson = await productImagesRes.json()
            const productImages = productImagesJson?.images

            if (!productImagesRes.ok || !Array.isArray(productImages) || productImages.length === 0) {
                toast({
                    title: 'Por favor intenta de nuevo',
                    description: productImagesJson?.error || 'Error al obtener imágenes de productos',
                    variant: 'destructive',
                })
                return
            }

            console.log(`✅ Seleccionados ${productImages.length} productos para: "${topicTitle}"`)
            productImages.forEach((img: any, i: number) => {
                console.log(`   ${i + 1}. ${img.name}`)
            })

            // Step 4: Generar superposiciones de texto con visión (AI analiza imágenes de productos)
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

            // Step 5: Analizar el último producto para visualización detallada en mockup
            const lastProductIndex = productImages.length - 1
            const lastProduct = productImages[lastProductIndex]
            
            // Obtener la calificación del último producto de la llamada anterior para asegurar consistencia
            const lastProductKey = `Product ${productImages.length}`
            const lastProductRating = parsedData[lastProductKey]
            const isPositive = lastProductRating?.emoji === '✅'
            const previousScore = lastProductRating?.score || 'unknown'
            
            console.log(`📱 Analizando último producto para mockup de app: ${lastProduct.name}`)
            console.log(`   Calificación previa: ${lastProductRating?.emoji} ${previousScore}`)
            
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

            // Step 6: Construir array final de imágenes
            // [firstImage, ...productImages, lastImage (última para análisis)]
            const finalImages = [
                firstImage, // Imagen 1: Página de título
                ...productImages.map((img: any) => img.url), // Imágenes de productos
                lastImage, // Última imagen: Página de análisis final (de upskin_firstpage_products)
            ]

            // Preparar datos para el store (dinámicamente basado en el número de productos)
            const finalData: any = {
                Title: spanishTitle, // Usar título en español de la IA
                'Product Analysis': productAnalysisData, // Análisis de producto para última página
            }

            // Agregar todos los productos a los datos
            Object.keys(parsedData).forEach((key) => {
                if (key !== 'Title') { // Skip Title as we already have it
                    finalData[key] = parsedData[key]
                }
            })

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

