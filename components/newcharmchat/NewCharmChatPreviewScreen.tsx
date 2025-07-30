'use client'

import { downloadImage } from '@/lib/utils'
import { ChevronRight, Download } from 'lucide-react'
import Image from 'next/image'
import { useMemo, useRef, useState } from 'react'
import { Poppins } from 'next/font/google';
import { useNewCharmChatStore } from '@/lib/store/newCharmChatStore'
import { DownloadButton } from './DownloadButton'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});


interface newCharmChatPreviewScreenProps {
  images: string[]
}

/* ---------------------------- Message Extractor --------------------------- */
function extractMessagesFromFlat(data: Record<string, string>) {
  const messages = []
  let i = 1
  while (data[`Don't Say Message ${i}`]) {
    messages.push({
      text: data[`Don't Say Message ${i}`],
      description: data[`Say Message ${i}`] || '',
    })
    i++
  }
  return messages
}
/* ---------------------------- Helper Function --------------------------- */
function addArrowSuffix(text: string): string {
  const trimmed = text.trim()
  if (trimmed.endsWith('.')) {
    return trimmed.slice(0, -1) + ' >>>'
  }
  return trimmed + ' >>>'
}

/* ---------------------------- 🔥 MAIN COMPONENT --------------------------- */
export default function NewCharmChatPreviewScreen({ images }: newCharmChatPreviewScreenProps) {
  const data = useNewCharmChatStore(state => state.data);
  const title = data?.['Title'] ?? ''
  const subtitle = addArrowSuffix(data?.['Subtitle'] ?? '')
  const tone = data?.['Tone'] ?? ''
  const reply = data?.['Message Prompt'] ?? ''

  const messages = extractMessagesFromFlat(data ?? {});
  const finalResult = 'Messages suggested by CharmChat.\n' + messages
    .map(msg => `Don't say: "${msg.text}"\nSay: "${msg.description}"`)
    .join('\n') + '\n#dating #relationship #texting #queen #feminineenergy '

  if (!images || images.length === 0) {
    return <div className="text-center text-gray-500">No preview images available.</div>
  }

  return (
    <div className='flex flex-col p-4'>
      <div className="grid grid-cols-1 place-items-center w-full">
        {images.map((img, index) => {
          const isFirst = index === 0
          const isLast = index === images.length - 1
          const isOnlyOne = images.length === 1

          // Format index as two digits (01, 02, 03, etc.)
          const sequentialIndex = String(index + 1).padStart(2, '0');

          // Case 1: Only one image → show only final page
          if (isOnlyOne) {
            return (
              <FinalMockupPage
                key={`final-${index}`}
                image={img}
                reply={reply}
                tone={tone}
                messages={messages.map(m => m.description)}
                downloadIndex={sequentialIndex}
              />
            )
          }

          // Case 2: First image = title page
          if (isFirst) {
            return (
              <TitlePage
                key={`title-${index}`}
                image={img}
                title={title}
                subtitle={subtitle}
                downloadIndex={sequentialIndex}
              />
            )
          }

          // Case 3: Last image = final page
          if (isLast) {
            return (
              <FinalMockupPage
                key={`final-${index}`}
                image={img}
                reply={reply}
                tone={tone}
                messages={messages.map(m => m.description)}
                downloadIndex={sequentialIndex}
              />
            )
          }

          // Case 4: Middle images = message pages
          const msg = messages[index - 1] // shift because first image is title
          return (
            <MessagePage
              key={`msg-${index}`}
              image={img}
              message={msg?.text ? `❌ Don't Say: "${msg.text}"` : ''}
              description={msg?.description ? `✅ Say this: "${msg.description}"` : ''}
              downloadIndex={sequentialIndex}
            />
          )
        })}
      </div>
      <div className="space-y-2 flex flex-col items-center">
        {/* Description */}
        <p className="text-gray-700 text-md whitespace-pre-line">
          {finalResult}
        </p>
      </div>
    </div>
  )
}

/* ------------------------- Utility -------------------------- */
function getImageSrc(image: File | string): string {
  return typeof image === 'string' ? image : URL.createObjectURL(image)
}

interface TitlePageProps {
  image: File | string
  title: string
  subtitle: string
  downloadIndex?: string
}

interface MessagePageProps {
  image: File | string
  message: string
  description: string
  downloadIndex?: string
}

interface FinalMockupPageProps {
  image?: File | string
  reply?: string
  tone?: string
  messages?: string[]
  downloadIndex?: string
}

/* --------------------- Title Page Component --------------------- */
function TitlePage({ image, title, downloadIndex }: TitlePageProps) {
  const ref = useRef<HTMLDivElement>(null)

  return (
    <div className="scale-[0.65] sm:scale-[0.9] md:scale-[0.6] lg:scale-[0.8] overflow-hidden shadow-md">
      <DownloadButton refEl={ref} filename={`${downloadIndex || '01'}.png`} />
      <div ref={ref}
        onClick={() => downloadImage(ref, `${downloadIndex || '01'}.png`)}
        className="relative cursor-pointer" style={{
          width: '450px',
          height: '600px',
        }}>
        <Image
          src={getImageSrc(image ?? '')}
          fill
          className="object-cover"
          alt="Title Page"
        />

        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-black text-center gap-8">

          {/* Title */}
          <div className="text-xl font-bold leading-snug max-w-xs">
            <span
              className="bg-white text-black px-3 py-1"
              style={{
                display: 'inline',
                boxDecorationBreak: 'clone',
                WebkitBoxDecorationBreak: 'clone'
              }}
            >
              {title}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------- Message Page Component ------------------- */
function MessagePage({ image, message, description, downloadIndex }: MessagePageProps) {
  const ref = useRef<HTMLDivElement>(null)

  return (
    <div className="scale-[0.65] sm:scale-[0.9] md:scale-[0.6] lg:scale-[0.8] overflow-hidden shadow-md">
      <DownloadButton refEl={ref} filename={`${downloadIndex || '01'}.png`} />
      <div ref={ref} 
      onClick={() => downloadImage(ref, `${downloadIndex || '01'}.png`)}
      className="relative cursor-pointer" style={{
        width: '450px',
        height: '600px',
      }}>
        <Image
          src={getImageSrc(image)}
          fill
          className="object-cover"
          alt="Message Page"
        />

        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-black text-center gap-8">
          {/* Message (white background) */}
          <div className="text-xl font-bold leading-snug max-w-xs">
            <span
              className="bg-white text-black px-3 py-1"
              style={{
                display: 'inline',
                boxDecorationBreak: 'clone',
                WebkitBoxDecorationBreak: 'clone'
              }}
            >
              {message}
            </span>
          </div>

          {/* Description (red background) */}
          <div className="text-xl font-bold leading-snug max-w-xs">
            <span
              className="bg-red-500 text-white px-3 py-1"
              style={{
                display: 'inline',
                boxDecorationBreak: 'clone',
                WebkitBoxDecorationBreak: 'clone'
              }}
            >
              {description}
            </span>
          </div>

        </div>
      </div>
    </div>
  )
}

/* ------------------ Final Mockup Page Component ------------------ */
function FinalMockupPage({ image, reply, tone, messages, downloadIndex }: FinalMockupPageProps) {

  const ref = useRef<HTMLDivElement>(null);

  const modifiedReply = `${reply}`
  const modifiedMessages = messages?.map((msg, index) => `${msg}`) ?? []

  const CHARS_PER_LINE = 30
  const countLines = (text: string) =>
    Math.ceil(text.length / CHARS_PER_LINE)

  const totalLines = useMemo(() => {
    const replyLines = modifiedReply ? countLines(modifiedReply) : 0
    const messageLines = modifiedMessages
      ? modifiedMessages.reduce((sum, msg) => sum + countLines(msg), 0)
      : 0
    return replyLines + messageLines
  }, [modifiedReply, modifiedMessages])

  // Compute top offset based on lines
  const topOffset = useMemo(() => {
    const baseTop = 40
    let shiftPerLine = 6
    if (totalLines >= 9) shiftPerLine = 7
    if (totalLines >= 5) shiftPerLine = 4
    const extraShift = totalLines * shiftPerLine
    return baseTop - extraShift
  }, [totalLines])

  return (
    <div className={`scale-[0.65] sm:scale-[0.9] md:scale-[0.6] ... lg:scale-[0.8] overflow-hidden shadow-md ${poppins.className}`}>
      <DownloadButton refEl={ref} filename={`${downloadIndex || '01'}.png`} />
      <div ref={ref}
      onClick={() => downloadImage(ref, `${downloadIndex || '01'}.png`)}
      className="relative cursor-pointer" style={{
        width: '450px',
        height: '600px',
      }}>
        <Image
          src={getImageSrc(image ?? '')}
          fill
          className="object-cover"
          alt="Final Page"
        />

        <div className={`w-[308px] scale-[0.60] p-2 px-4 flex flex-col gap-4 absolute left-0 z-30 bg-[#FAFAFA] text-gray-900 shadow-lg ... border border-gray-200 ${poppins.className}`} style={{ top: `${topOffset}px` }}>
          <div className="absolute scale-[1.05] flex left-[200px] -top-36 flex-col z-40 items-end space-y-2 text-right text-[11px] text-white">
            <div className='border border-purple-600 rounded-full ring-offset-4 ring-purple-600 text-purple-600 p-2'>
              <div className="bg-purple-100 text-purple-600 py-1 px-10 flex items-center justify-center text-center w-80 rounded-full text-[24px] font-semibold">
                Download "CharmChat" App
              </div>
            </div>
            <div className="bg-purple-100 text-purple-600 relative p-3 mr-1 flex items-center border-[3px] border-purple-600 justify-center text-start w-64 rounded-2xl text-[18px] font-semibold">
              Copy and paste to make him obsessed with you.
              <img src={'/charmchat/crown.png'} className='w-24 h-12 rotate-[12deg] scale-50 absolute -top-8 -right-9' />
            </div>
          </div>


          {/* Header */}
          <div className="flex items-center w-full justify-center text-xl"><img src={'/charmchat/Logo.svg'} /></div>

          {/* Toggle */}
          <div className="flex bg-[#ebebeb] p-1 rounded-xl gap-2">
            <div
              className="flex gap-1 items-center w-1/2 justify-center text-sm bg-white font-medium py-1.5 px-2 rounded-[8px] transition"
            >
              <img src={'/charmchat/magic.png'} className='w-4 h-4' /> Reply
            </div>
            <div
              className="flex gap-1 text-[#a3a3a3] items-center w-1/2 justify-center text-[16px] font-medium py-1.5 px-2 rounded-[8px]"
            >
              <img src={'/charmchat/edit.png'} className='w-4 h-4' /> Compose
            </div>
          </div>

          {/* Prompt Block */}
          <div className="bg-white w-full p-4 flex flex-col gap-2 rounded-xl" style={{ boxShadow: '0px 4px 16px 0px #0000000D' }}>
            <div className="text-[12px] text-[#8063EF] font-medium flex items-center">{tone} Mode<ChevronRight size={16} /></div>
            <div className="text-[15px] font-medium text-black leading-snug line-clamp-4">
              {modifiedReply || 'Make him terrified of losing me'}
            </div>
          </div>

          {/* Suggestions Header */}
          <div className="flex justify-between font-medium items-center px-4 text-sm text-gray-600">
            <span>Suggestions</span>
            <span className="text-[12px] text-[#8063EF] font-medium flex gap-2 items-center"><img src={'/charmchat/Adjust.svg'} className='w-3 h-3' />Adjust</span>
          </div>

          {/* Suggestions List */}
          <div className="flex flex-col gap-3">
            {modifiedMessages?.slice(0, 3).map((msg, index) => (
              <div
                key={index}
                className="bg-white text-[15px] font-medium text-black leading-snug w-full p-4 flex flex-col gap-2 rounded-xl" style={{ boxShadow: '0px 4px 16px 0px #0000000D' }}
              >
                <p className="leading-snug line-clamp-4">{msg}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>V{index + 1}</span>
                  <div className='bg-[#F2F2F2] p-2 w-[30px] h-[30px] flex items-center justify-center rounded-full'>
                    <img src={'/charmchat/Copy.svg'} className='w-8 h-8 ' />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className='bg-[#FAFAFA] flex items-center justify-around h-10 -mt-6'>
            <img src={'/charmchat/b-1.svg'} className='w-8 h-8 ' />
            <img src={'/charmchat/b-2.svg'} className='w-8 h-8 ' />
            <img src={'/charmchat/b-3.svg'} className='w-8 h-8 ' />
          </div>
        </div>
      </div>
    </div>
  )
}
