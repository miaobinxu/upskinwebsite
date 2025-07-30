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