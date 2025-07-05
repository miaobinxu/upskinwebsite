'use client'

import CharmChatUploadScreen from '@/components/charmchat/CharmChatUploadScreen'
import { generateCharmChatCarousel } from '@/lib/generate-charmchat-carousel'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useCharmChatStore } from '@/lib/store/charmChatStore'
import CharmChatPreviewScreen from '@/components/charmchat/CharmChatPreviewScreen'

interface GeneratePayload {
  images: File[]
  textStyle: string
  tone: string
  replyMessage: string
  pageLines: PageLine[]
}

interface PageLine {
  line1: string
  line2: string
}

export default function Page() {
  const [currentScreen, setCurrentScreen] = useState<'upload' | 'preview'>('upload')
  const [loading, setLoading] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const { toast } = useToast()
  const setData = useCharmChatStore((s) => s.setData)

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  const handleGenerate = async (data: GeneratePayload) => {
    setLoading(true)
    try {
      // Step 1: Convert images to base64 (not currently used, but kept for future)
      const base64Images = await Promise.all(data.images.map(fileToBase64))
      setPreviewImages(base64Images);
      /* ---------------- Step 2: Call your AI generation function ---------------- */
      const { data: response, error } = await generateCharmChatCarousel({
        pageInputs: data.pageLines,
        textStyle: data.textStyle,
        tone: data.tone,
        replyMessage: data.replyMessage,
      })

      const rawContent = response?.choices?.[0]?.message?.content

      if (!rawContent) {
        toast({
          title: 'No AI Response',
          description: 'The AI did not return any content.',
          variant: 'destructive',
        })
        return
      }

      /* ---------------------- Step 3: Clean and parse JSON ---------------------- */
      const jsonString = rawContent.trim().replace(/^```json/, '').replace(/```$/, '').trim()

      let parsedData
      try {
        parsedData = JSON.parse(jsonString)
      } catch (err) {
        toast({
          title: 'Invalid JSON',
          description: 'Failed to parse AI response.',
          variant: 'destructive',
        })
        return
      }

      /* ------------------------ Step 4: Store to Zustand ------------------------ */
      setData(parsedData)

      /* -------------- Step 5: Navigate to preview or success state -------------- */
      setCurrentScreen('preview')
    } catch (error) {
      console.error('Unexpected error:', error)
      toast({
        title: 'Generation Error',
        description: 'Something went wrong while generating content.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex-1">
      {currentScreen === 'upload' ? (
        <CharmChatUploadScreen onGenerate={handleGenerate} loading={loading} />
      ) : (
        <CharmChatPreviewScreen images={previewImages} />
      )}
    </main>
  )
}
