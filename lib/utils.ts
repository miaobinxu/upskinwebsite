import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { toPng } from 'html-to-image'
import { error } from "console";


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const convertImageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};


export const downloadImage = async (ref: React.RefObject<HTMLElement | null>, filename = 'screenshot.png') => {
  if (!ref.current) return

  try {
    const dataUrl = await toPng(ref.current, {
      cacheBust: true,
      pixelRatio: 3,
      backgroundColor: '#fff',
    })

    const link = document.createElement('a')
    link.href = dataUrl
    link.download = filename
    link.click()
  } catch (err) {
    throw Error('Failed to download')
  }
}

// downloadImageFromBrowserless.ts
export const downloadImageFromBrowserless = async (
  ref: React.RefObject<HTMLElement | null>,
  filename = 'screenshot.png'
) => {
  if (!ref?.current) {
    console.warn('DOM ref is not available.')
    return
  }

  const htmlContent = `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; font-family: sans-serif; }
        </style>
      </head>
      <body>
        ${ref.current.outerHTML}
      </body>
    </html>
  `

  try {
    const res = await fetch('/api/screenshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html: htmlContent,
        options: {
          type: 'png',
          deviceScaleFactor: 2,
          viewport: {
            width: ref.current?.offsetWidth || 600,
            height: ref.current?.offsetHeight || 800,
          },
        },
      }),
    })

    console.log('res****************', res)

    if (!res.ok) throw new Error(`Request failed with status ${res.status}`)

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Screenshot failed:', err)
    throw new Error('Screenshot generation failed')
  }
}

