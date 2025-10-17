import { Download } from 'lucide-react'
import { downloadImage } from '@/lib/utils'
import toast from 'react-hot-toast'

type Props = {
  refEl: React.RefObject<HTMLElement | null>
  filename: string
}

export function DownloadButton({ refEl, filename }: Props) {

  const handleDownload = async () => {
    try {
      await downloadImage(refEl, filename)
    } catch (err) {
      toast.error('Please reload the page and try again.')
    }
  }
  
  return (
    <button
      onClick={handleDownload}
      className="absolute top-2 right-2 z-50 bg-white/90 hover:bg-white text-gray-800 px-2 py-1 rounded-full shadow transition"
    >
      <Download size={26} />
    </button>
  )
} 