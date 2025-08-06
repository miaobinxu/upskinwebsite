import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface FRBase {
  Title: string
  Subtitle: string
  "Message Prompt": string
  Tone: string
  "Post description and hashtag": string
}

export type FRData = FRBase & {
  [key: string]: string
}

interface FRState {
  data: FRData | null
  setData: (newData: FRData) => void
  clearData: () => void
}

export const useFRStore = create<FRState>()(
  persist(
    (set) => ({
      data: null,
      setData: (newData) => set({ data: newData }),
      clearData: () => set({ data: null }),
    }),
    {
      name: 'fr',
    }
  )
)
