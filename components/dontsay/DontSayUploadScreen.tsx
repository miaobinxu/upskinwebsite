'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { Upload, X, ImageIcon, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '../ui/label'
import toast from 'react-hot-toast'

interface PageLine {
  line1: string
  line2: string
}

interface UploadScreenProps {
  onGenerate: (
    data: {
      images: File[],
      textStyle: string
      tone: string
      replyMessage: string
      pageLines: PageLine[]
    }
  ) => void
  loading: boolean
}

export default function DontSayUploadScreen({ onGenerate, loading }: UploadScreenProps) {
  const [files, setFiles] = useState<File[]>([])
  const [imageURLs, setImageURLs] = useState<string[]>([])
  const [pageLines, setPageLines] = useState<PageLine[]>([])
  const [tone, setTone] = useState('')
  const [replyMessage, setReplyMessage] = useState('')
  const [textStyle, setTextStyle] = useState('style1')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* -------------------- Handle Image Preview URLs -------------------- */
  useEffect(() => {
    const urls = files.map(file => URL.createObjectURL(file))
    setImageURLs(urls)

    return () => {
      urls.forEach(url => URL.revokeObjectURL(url))
    }
  }, [files])

  const updatePageLinesToMatchFiles = (newFiles: File[]) => {
    setPageLines(prev => newFiles.map((_, i) => prev[i] ?? { line1: '', line2: '' }))
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    const updatedFiles = [...files, ...selected].slice(0, 10)
    setFiles(updatedFiles)
    updatePageLinesToMatchFiles(updatedFiles)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files || []).filter(file =>
      file.type.startsWith('image/')
    )
    const updatedFiles = [...files, ...droppedFiles].slice(0, 10)
    setFiles(updatedFiles)
    updatePageLinesToMatchFiles(updatedFiles)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const removeImage = (idx: number) => {
    const newFiles = files.filter((_, i) => i !== idx)
    setFiles(newFiles)
    updatePageLinesToMatchFiles(newFiles)
  }

  const updatePageLine = (idx: number, field: 'line1' | 'line2', value: string) => {
    const updatedLines = [...pageLines]
    updatedLines[idx] = { ...updatedLines[idx], [field]: value }
    setPageLines(updatedLines)
  }

  const handleSubmit = () => {
    const ua = navigator.userAgent;
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    const isChromeDesktop = /Chrome/.test(ua) && !isSafari && !isMobile;

    if (!isChromeDesktop) {
      toast.error("This feature is only supported in Chrome on desktop. Please switch browser.");
      return;
    }

    const payload = {
      images: files,
      textStyle,
      tone,
      replyMessage,
      pageLines
    }
    onGenerate(payload)
  }

  const handleReset = () => {
    setFiles([])
    setPageLines([])
    setImageURLs([])
    setTone('')
    setReplyMessage('')
    setTextStyle('style1')
    setIsDragging(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const renderImageUploadCard = () => (
    <Card
      className="rounded-2xl border-2 shadow-sm"
      style={{ borderColor: files.length > 0 ? '#6D9886' : '#e5e7eb' }}
    >
      <CardContent className="p-6 sm:p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#F2E7D5]">
            <ImageIcon className="h-5 w-5" style={{ color: '#6D9886' }} />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-[#393E46]">Upload Background Images</h3>
            <p className="text-sm text-gray-600">Supports JPEG, PNG, WebP — up to 10MB</p>
          </div>
        </div>

        <div
          className={`border-2 border-dashed rounded-2xl cursor-pointer transition-shadow ${isDragging
            ? 'border-[#6D9886] bg-[#F2E7D5]/30 shadow-md'
            : 'border-gray-300 hover:border-[#6D9886] hover:bg-[#F2E7D5]/10'
            }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="p-8 sm:p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-[#F2E7D5]">
              <Upload className="h-8 w-8" style={{ color: '#6D9886' }} />
            </div>
            <p className="text-gray-700 font-medium mb-2">Click to upload or drag and drop</p>
            <p className="text-sm text-gray-500">
              Upload multiple background images (3:4 recommended)
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handleUpload}
            className="hidden"
          />
        </div>
      </CardContent>
    </Card>
  )

  const renderImageInputBlocks = () =>
    files.map((file, idx) => (
      <div
        key={idx}
        className="flex flex-col sm:flex-row relative items-start gap-4 p-4 border-2 border-gray-200 rounded-2xl shadow-lg bg-muted/30"
      >
        <div className="relative w-[120px] sm:w-[150px] aspect-[3/4] shrink-0 overflow-hidden rounded-lg">
          {imageURLs[idx] && (
            <Image
              src={imageURLs[idx]}
              alt={`Page ${idx + 1}`}
              fill
              className="object-cover rounded-xl border border-gray-300"
            />
          )}
        </div>
        <div className="sm:w-[60%] w-full space-y-2">
          <Label className="text-md font-semibold text-[#393E46]">
            Page {idx + 1} Content
          </Label>
          <Input
            placeholder="Line 1"
            value={pageLines[idx]?.line1 ?? ''}
            onChange={e => updatePageLine(idx, 'line1', e.target.value)}
            className="w-full h-12 rounded-xl border-2 border-[#393E46] focus:border-[#6D9886] shadow-sm"
          />
          <Input
            placeholder="Line 2"
            value={pageLines[idx]?.line2 ?? ''}
            onChange={e => updatePageLine(idx, 'line2', e.target.value)}
            className="w-full h-12 rounded-xl border-2 border-[#393E46] focus:border-[#6D9886] shadow-sm"
          />
        </div>
        <Button
          variant="destructive"
          size="icon"
          onClick={() => removeImage(idx)}
          className="absolute top-0 right-0 w-8 h-8 z-10 rounded-full text-white shadow-xl hover:bg-red-600 bg-red-700"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    ))

  const renderFormInputs = () => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-[#393E46]">Text Style</Label>
        <Select value={textStyle} onValueChange={setTextStyle}>
          <SelectTrigger className="w-full h-12 rounded-xl border-2 border-[#393E46] focus:border-[#6D9886] shadow-sm">
            <SelectValue placeholder="Select text style" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-md">
            <SelectItem value="style1">Style 1</SelectItem>
            <SelectItem value="style2" disabled>Style 2</SelectItem>
            <SelectItem value="style3" disabled>Style 3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-semibold text-[#393E46]">Tone</Label>
        <Input
          type="text"
          placeholder="e.g. playful, serious"
          value={tone}
          onChange={e => setTone(e.target.value)}
          className="w-full h-12 rounded-xl border-2 border-[#393E46] focus:border-[#6D9886] shadow-sm"
        />
      </div>

      <div className="sm:col-span-3 space-y-3">
        <Label className="text-sm font-semibold text-[#393E46]">Reply Message</Label>
        <Textarea
          placeholder="Paste the message you're replying to (optional)"
          value={replyMessage}
          onChange={e => setReplyMessage(e.target.value)}
          className="w-full h-12 rounded-xl border-2 border-[#393E46] focus:border-[#6D9886] shadow-sm"
        />
      </div>
    </div>
  )

  const renderSubmitButton = () => (
    <Button
      onClick={handleSubmit}
      disabled={loading || files.length === 0}
      className={`w-full mt-8 h-14 text-lg font-semibold ${(loading || files.length === 0) && 'cursor-not-allowed'} rounded-xl shadow-md disabled:opacity-50`}
      style={{
        backgroundColor: files.length !== 0 ? "#6D9886" : "#d1d5db",
        color: "white",
      }}
      size="lg"
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Generating...
        </span>
      ) : (
        <>
          <Sparkles className="h-5 w-5 mr-2 text-yellow-400" />
          Generate DontSay Carousel
        </>
      )}
    </Button>
  )

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-10">
      <h1 className="text-3xl font-semibold text-center">DontSay Tool</h1>
      {renderImageUploadCard()}
      {files.length > 0 && <div className="space-y-6">{renderImageInputBlocks()}</div>}
      {renderFormInputs()}
      <div className="pt-4 sm:gap-6 gap-4 w-full flex max-sm:flex-col items-center justify-center">
        {renderSubmitButton()}
        <Button
          variant="outline"
          disabled={loading}
          onClick={handleReset}
          className="sm:mt-8 h-14 text-lg hover:bg-gray-200 w-full font-semibold rounded-xl shadow-md disabled:opacity-50"
        >
          Reset
        </Button>
      </div>
    </div>
  )
} 