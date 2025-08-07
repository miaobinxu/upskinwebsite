import { Sparkles } from 'lucide-react'
import React, { useState } from 'react'
import { Button } from '../ui/button'
import toast from 'react-hot-toast'

interface UploadScreenProps {
  onGenerate: () => void
  loading: boolean
}


export default function JPUploadScreen({ onGenerate, loading }: UploadScreenProps) {

  const handleGenerate = () => {
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);
    const isChrome = /Chrome/i.test(ua);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    
    // Allow Chrome on desktop or Chrome on Android, but block iOS and other browsers
    const isChromeAllowed = isChrome && !isSafari && (!isIOS);

    if (!isChromeAllowed) {
      if (isIOS) {
        toast.error("This feature is not supported on iOS devices. Please use Chrome on Android or computer.");
      } else {
        toast.error("This feature is only supported in Chrome on computer or Android. Please switch browser.");
      }
      return;
    }
    onGenerate()
  }

  return (
    <div className='flex flex-col items-center justify-center h-full py-20'>
      <Button
        onClick={handleGenerate}
        disabled={loading}
        className={`bg-[#6D9886] hover:bg-[#63907d] h-14 text-lg font-semibold ${loading && 'cursor-not-allowed'} rounded-xl shadow-md disabled:opacity-50`}
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
            Generate JP
          </>
        )}
      </Button>
    </div>
  )
}
