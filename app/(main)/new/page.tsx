'use client'

import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import NewCharmChatUploadScreen from '@/components/newcharmchat/NewCharmChatUploadScreen'
import { generateNewCharmChatCarousel } from '@/lib/generate-new-charmchat'
import { useNewCharmChatStore } from '@/lib/store/newCharmChatStore'
import NewCharmChatPreviewScreen from '@/components/newcharmchat/NewCharmChatPreviewScreen'

// const imagesData = [
//   "https://ujzzcntzxbljuaiaeebc.supabase.co/storage/v1/object/sign/files/charmtool2/c3d2aeb7838a95c85f47af4564d6cf63.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9kMjc0OThkZC05ODM5LTQ1MGItOTI2NC1jMmYyZmI5YTFlMTEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJmaWxlcy9jaGFybXRvb2wyL2MzZDJhZWI3ODM4YTk1Yzg1ZjQ3YWY0NTY0ZDZjZjYzLmpwZyIsImlhdCI6MTc1Mzg0NzU5NCwiZXhwIjoxNzUzODQ4MTk0fQ.PQivM0L4q17NKgJV3eN2eY3WSj6Ni3dgwXZWo36ZZsE",
//   "https://ujzzcntzxbljuaiaeebc.supabase.co/storage/v1/object/sign/files/charmtool2/32248cb7b0a77885900499794525ace0.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9kMjc0OThkZC05ODM5LTQ1MGItOTI2NC1jMmYyZmI5YTFlMTEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJmaWxlcy9jaGFybXRvb2wyLzMyMjQ4Y2I3YjBhNzc4ODU5MDA0OTk3OTQ1MjVhY2UwLmpwZyIsImlhdCI6MTc1Mzg0NzU5NCwiZXhwIjoxNzUzODQ4MTk0fQ.-t6HnN6qO1FB-qazPWjHjEfqZmvQBPsVLM9UdCgDb7E",
//   "https://ujzzcntzxbljuaiaeebc.supabase.co/storage/v1/object/sign/files/charmtool2/3b786be7425bcb949468542f60809e86.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9kMjc0OThkZC05ODM5LTQ1MGItOTI2NC1jMmYyZmI5YTFlMTEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJmaWxlcy9jaGFybXRvb2wyLzNiNzg2YmU3NDI1YmNiOTQ5NDY4NTQyZjYwODA5ZTg2LmpwZyIsImlhdCI6MTc1Mzg0NzU5NSwiZXhwIjoxNzUzODQ4MTk1fQ.P7VMUCMUq1WpT1ARxtpPPr6KQ7nSdf05516Yz3loSpg",
//   "https://ujzzcntzxbljuaiaeebc.supabase.co/storage/v1/object/sign/files/charmtool2/c050235169bcd1527aa20a0893adc946.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9kMjc0OThkZC05ODM5LTQ1MGItOTI2NC1jMmYyZmI5YTFlMTEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJmaWxlcy9jaGFybXRvb2wyL2MwNTAyMzUxNjliY2QxNTI3YWEyMGEwODkzYWRjOTQ2LmpwZyIsImlhdCI6MTc1Mzg0NzU5NiwiZXhwIjoxNzUzODQ4MTk2fQ.wtYh8iWKVdkDukdFO5uPUbqWaXTnAwPOIN66Z6kf4b0",
//   "https://ujzzcntzxbljuaiaeebc.supabase.co/storage/v1/object/sign/files/charmtool2/e9a37834bff6ba0e232476e369bdd70e.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9kMjc0OThkZC05ODM5LTQ1MGItOTI2NC1jMmYyZmI5YTFlMTEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJmaWxlcy9jaGFybXRvb2wyL2U5YTM3ODM0YmZmNmJhMGUyMzI0NzZlMzY5YmRkNzBlLmpwZyIsImlhdCI6MTc1Mzg0NzU5NywiZXhwIjoxNzUzODQ4MTk3fQ.4dwV1x3n-h7YTU7rWoomEpKo4G1BrnNR_fE1mkOB79E"
// ]

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

            const { data: response, error } = await generateNewCharmChatCarousel({ topic: topicTitle })

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
                <NewCharmChatUploadScreen onGenerate={handleGenerate} loading={loading} />
            ) : (
                <NewCharmChatPreviewScreen images={previewImages} />
            )}
        </main>
    )
}
