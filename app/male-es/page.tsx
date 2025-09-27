'use client'

import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import NewCharmChatUploadScreenEs from '@/components/newcharmchat/NewCharmChatUploadScreenEs'
import { generateNewCharmChatCarouselEs } from '@/lib/generate-new-charmchat-es'
import { useNewCharmChatStore } from '@/lib/store/newCharmChatStore'
import NewCharmChatPreviewScreenEs from '@/components/newcharmchat/NewCharmChatPreviewScreenEs'

export default function Page() {
    const [currentScreen, setCurrentScreen] = useState<'upload' | 'preview'>('upload')
    const [loading, setLoading] = useState(false)
    const [previewImages, setPreviewImages] = useState<string[]>([])
    const { toast } = useToast()
    const setData = useNewCharmChatStore((s) => s.setData)

    const handleGenerate = async () => {
        setLoading(true)
        try {
            const [topicRes, imageRes] = await Promise.all([
                fetch('/api/topic?lang=es'),
                fetch('/api/get-images'),
            ])

            const [topicJson, imageJson] = await Promise.all([
                topicRes.json(),
                imageRes.json(),
            ])

            const topicTitle = topicJson?.topic?.title
            if (!topicRes.ok || !topicTitle) {
                toast({
                    title: 'Por favor, inténtalo de nuevo',
                    description: 'Error al obtener el tema',
                    variant: 'destructive',
                })
                return
            }

            const images = imageJson?.images
            if (!imageRes.ok || !Array.isArray(images) || images.length < 1) {
                toast({
                    title: 'Por favor, inténtalo de nuevo',
                    description: 'Error al obtener las imágenes',
                    variant: 'destructive',
                })
                return
            }

            const { data: response, error } = await generateNewCharmChatCarouselEs({ topic: topicTitle })

            // Log API provider info for monitoring
            if (response?._metadata) {
                console.log(`📊 Topic: "${topicTitle}" | Provider: ${response._metadata.provider} | Fallback: ${response._metadata.usedFallback}`)
                if (response._metadata.usedFallback) {
                    console.log('⚠️ Azure failed (filtered or empty content), used OpenAI fallback')
                }
            }

            const rawContent = response?.choices?.[0]?.message?.content?.trim()
            if (error || !rawContent) {
                throw new Error(error || 'La IA no devolvió contenido')
            }

            const jsonString = rawContent.replace(/^```json/, '').replace(/```$/, '').trim()
            let parsedData: any

            try {
                parsedData = JSON.parse(jsonString)
            } catch (err) {
                throw new Error('Error al analizar la respuesta de la IA')
            }

            setPreviewImages(images)
            setData(parsedData)
            setCurrentScreen('preview')

        } catch (error: any) {
            console.error('🚨 Error inesperado:', error)
            toast({
                title: 'Error de Generación',
                description: error.message || 'Algo salió mal.',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="flex flex-col h-full">
            {currentScreen === 'upload' ? (
                <NewCharmChatUploadScreenEs onGenerate={handleGenerate} loading={loading} />
            ) : (
                <NewCharmChatPreviewScreenEs images={previewImages} />
            )}
        </main>
    )
} 