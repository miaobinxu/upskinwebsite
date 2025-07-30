import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { toPng } from 'html-to-image'
import domtoimage from 'dom-to-image-more'


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


export const downloadImageNew = async (
  ref: React.RefObject<HTMLElement | null>,
  filename = 'screenshot.png'
) => {
  if (!ref.current) return

  try {
    // Step 1: Clone the node
    const clone = ref.current.cloneNode(true) as HTMLElement

    // Step 2: Strip borders & shadows from clone and its children
    const stripStyles = (node: HTMLElement) => {
      node.style.border = 'none'
      node.style.boxShadow = 'none'
      node.style.outline = 'none'
      node.style.backgroundClip = 'border-box' // optional
    }

    clone.querySelectorAll<HTMLElement>('*').forEach(stripStyles)
    stripStyles(clone) // apply to root also

    // Step 3: Inject clone into hidden DOM
    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.top = '-9999px'
    container.style.left = '-9999px'
    container.style.zIndex = '-1'
    container.appendChild(clone)
    document.body.appendChild(container)

    // Step 4: Convert to image
    const dataUrl = await domtoimage.toPng(clone, {
       cacheBust: true,
  quality: 1,                // Use max quality for JPEG (ignored for PNG, but safe to keep)
  bgcolor: 'transparent',   // Transparent background
  height: clone.scrollHeight * 2,  // Increase resolution
  width: clone.scrollWidth * 2,
  style: {
    transform: 'scale(2)',   // Scale up for better quality
    transformOrigin: 'top left',
  },
    })

    // Step 5: Cleanup
    document.body.removeChild(container)

    // Step 6: Trigger download
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = filename
    link.click()
  } catch (err) {
    console.error(err)
    throw Error('Failed to download image')
  }
}