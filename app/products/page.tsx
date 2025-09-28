'use client'

import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import ProductsUploadScreen from '@/components/products/ProductsUploadScreen'
import ProductsPreviewScreen from '@/components/products/ProductsPreviewScreen'
import { generateProductsCarousel } from '@/lib/generate-products'
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
            const [topicRes, imageRes] = await Promise.all([
                fetch('/api/topic'),
                fetch('/api/get-images'),
            ])

            const [topicJson, imageJson] = await Promise.all([
                topicRes.json(),
                imageRes.json(),
            ])

            const topicTitle = topicJson?.topic?.title
            if (!topicRes.ok || !topicTitle) {
                toast({
                    title: 'Please try again',
                    description: 'Failed to fetch topic',
                    variant: 'destructive',
                })
                return
            }

            const images = imageJson?.images
            if (!imageRes.ok || !Array.isArray(images) || images.length < 1) {
                toast({
                    title: 'Please try again',
                    description: 'Failed to fetch images',
                    variant: 'destructive',
                })
                return
            }

            const { data: response, error } = await generateProductsCarousel({ topic: topicTitle })

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

            setPreviewImages(images)
            setData(parsedData)
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