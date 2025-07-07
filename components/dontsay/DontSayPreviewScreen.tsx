'use client'

import { useDontSayStore } from '@/lib/store/dontSayStore'
import { downloadImage } from '@/lib/utils'
import { ChevronRight, ClipboardCopyIcon, Download, SquarePen } from 'lucide-react'
import Image from 'next/image'
import { useMemo, useRef, useState } from 'react'
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});


interface DontSayPreviewScreenProps {
  images: string[]
}

/* ---------------------------- Message Extractor --------------------------- */
function extractMessagesFromFlat(data: Record<string, string>) {
  const messages = []
  let i = 1
  while (data[`Message ${i}`]) {
    messages.push({
      text: data[`Message ${i}`],
      description: data[`Message ${i} Description`] || '',
    })
    i++
  }
  return messages
}

/* ---------------------------- 🔥 MAIN COMPONENT --------------------------- */
export default function DontSayPreviewScreen({ images }: DontSayPreviewScreenProps) {
  const data = useDontSayStore(state => state.data);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const title = data?.['Title'] ?? ''
  const subtitle = data?.['Subtitle'] ?? ''
  const tone = data?.['Tone'] ?? ''
  const reply = data?.['Message Prompt'] ?? ''

  const messages = extractMessagesFromFlat(data ?? {});
  const finalResult = messages
  .map(msg => `"${msg.text}" - ${msg.description}`)
  .join('\n') + '\n#dating #relationship #texting #queen #feminineenergy'

  if (!images || images.length === 0) {
    return <div className="text-center text-gray-500">No preview images available.</div>
  }

  const handleCopy = (tag: string, index: number) => {
    navigator.clipboard.writeText(tag);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 1000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-center">DontSay Preview</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => handleCopy(finalResult, 0)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ClipboardCopyIcon className="h-4 w-4" />
            <span>{copiedIndex === 0 ? 'Copied!' : 'Copy All'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Title Page */}
        {title && (
          <div className="relative">
            <TitlePage 
              image={images[0]} 
              title={title} 
              subtitle={subtitle} 
            />
          </div>
        )}

        {/* Message Pages */}
        {messages.map((msg, index) => (
          <div key={index} className="relative">
            <MessagePage 
              image={images[index + 1] || images[0]} 
              message={msg.text} 
              description={msg.description} 
            />
          </div>
        ))}

        {/* Final App Preview */}
        <div className="relative">
          <FinalMockupPage 
            image={images[images.length - 1]} 
            reply={reply} 
            tone={tone} 
            messages={messages.map(m => m.text)} 
          />
        </div>
      </div>

      {/* Display Result */}
      <div className="space-y-2 flex flex-col items-center">
        <p className="text-gray-700 text-md">
          {title}
        </p>
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

/* ------------------- Title Page Component ------------------- */
function TitlePage({ image, title, subtitle }: {
  image: File | string
  title: string
  subtitle: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  
  return (
    <div className="scale-[0.65] sm:scale-[0.9] md:scale-[0.6] lg:scale-[0.8] overflow-hidden shadow-md">
      <button
        onClick={() => downloadImage(ref, 'dontsay-title.png')}
        className="absolute top-2 right-2 z-50 bg-white/90 hover:bg-white text-gray-800 px-2 py-1 rounded-full shadow transition"
      >
        <Download size={26} />
      </button>
      <div ref={ref} className="relative" style={{
        width: '450px',
        height: '600px',
      }}>
        <Image
          src={getImageSrc(image)}
          fill
          className="object-cover"
          alt="Title Page"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h1 className="text-3xl font-bold mb-2 leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg font-medium opacity-90 leading-tight">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function wrapTextLines(text: string, maxLineLength = 25): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if ((current + word).length > maxLineLength) {
      lines.push(current.trim());
      current = word + ' ';
    } else {
      current += word + ' ';
    }
  }

  if (current) lines.push(current.trim());
  return lines;
}

/* ------------------- Message Page Component ------------------- */
function MessagePage({ image, message, description }: {
  image: File | string
  message: string
  description: string
}) {

  const messageLines = wrapTextLines(message, 35);
  const descLines = wrapTextLines(description, 35);
  const ref = useRef<HTMLDivElement>(null)

  return (
    <div className="scale-[0.65] sm:scale-[0.9] md:scale-[0.6] lg:scale-[0.8] overflow-hidden shadow-md">
      <button
        onClick={() => downloadImage(ref, 'dontsay-title.png')}
        className="absolute top-2 right-2 z-50 bg-white/90 hover:bg-white text-gray-800 px-2 py-1 rounded-full shadow transition"
      >
        <Download size={26} />
      </button>
      <div ref={ref} className="relative" style={{
        width: '450px',
        height: '600px',
      }}>
        <Image
          src={getImageSrc(image)}
          fill
          className="object-cover"
          alt="Message Page"
        />

        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-black text-center gap-3">

          {/* Message (white background) */}
          <div className="flex flex-col items-center text-xl font-bold leading-tight">
            {messageLines.map((line, idx) => {
              return (
                <span
                  key={`msg-${idx}`}
                  className="bg-white text-black px-3 py-1"
                >
                  {line}
                </span>
              );
            })}
          </div>

          {/* Description (red background) */}
          <div className="flex flex-col items-center text-xl font-bold leading-tight">
            {descLines.map((line, idx) => {
              return (
                <span
                  key={`desc-${idx}`}
                  className="bg-red-500 text-white px-3 py-1"
                >
                  {line}
                </span>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  )
}

/* ------------------ Final Mockup Page Component ------------------ */
function FinalMockupPage({ image, reply, tone, messages }: {
  image?: File | string
  reply?: string
  tone?: string
  messages?: string[]
}) {

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
    console.log('messageLines********', messageLines)
    return replyLines + messageLines
  }, [modifiedReply, modifiedMessages])

  // Compute top offset based on lines
  const topOffset = useMemo(() => {
    const baseTop = 40
    let shiftPerLine = 6
    if (totalLines >= 9) shiftPerLine = 7
    if (totalLines >= 5) shiftPerLine = 4
    const extraShift = totalLines * shiftPerLine
    console.log('baseTop - extraShift********', totalLines)
    return baseTop - extraShift
  }, [totalLines])

  return (
    <div className="scale-[0.65] sm:scale-[0.9] md:scale-[0.6] lg:scale-[0.8] overflow-hidden shadow-md">
      <button
        onClick={() => downloadImage(ref, 'dontsay-app.png')}
        className="absolute top-2 right-2 z-50 bg-white/90 hover:bg-white text-gray-800 px-2 py-1 rounded-full shadow transition"
      >
        <Download size={26} />
      </button>
      <div ref={ref} className="relative" style={{
        width: '450px',
        height: '600px',
      }}>
        <Image
          src={'/charmchat/bg.png'}
          fill
          className="object-cover"
          alt="Final Mockup"
        />

        <div className="absolute inset-0 flex flex-col gap-3 px-6 text-black" style={{
          paddingTop: `${topOffset}px`,
          paddingBottom: '40px',
        }}>

          {/* Tab Toggle */}
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
            <div className="text-[12px] text-[#8063EF] font-medium flex items-center">{tone} <ChevronRight size={16} /></div>
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