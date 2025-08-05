'use client'

import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import ESUploadScreen from '@/components/ES/ESUploadScreen'
import { generateESCarousel } from '@/lib/generate-ES'
import { useESStore } from '@/lib/store/ESStore'
import ESPreviewScreen from '@/components/ES/ESPreviewScreen'

export default function Page() {
    const [currentScreen, setCurrentScreen] = useState<'upload' | 'preview'>('upload')
    const [loading, setLoading] = useState(false)
    const [previewImages, setPreviewImages] = useState<string[]>([])
    const { toast } = useToast()
    const setData = useESStore((s) => s.setData)

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

            const { data: response, error } = await generateESCarousel({ topic: topicTitle })

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
                title: 'Generation Error',
                description: error.message || 'Something went wrong.',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="flex flex-col h-full">
            {currentScreen === 'upload' ? (
                <ESUploadScreen onGenerate={handleGenerate} loading={loading} />
            ) : (
                <ESPreviewScreen images={previewImages} />
            )}
        </main>
    )
}
