import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface TRBase {
  Title: string
  Subtitle: string
  "Message Prompt": string
  Tone: string
  "Post description and hashtag": string
}

export type TRData = TRBase & {
  [key: string]: string
}

interface TRState {
  data: TRData | null
  setData: (newData: TRData) => void
  clearData: () => void
}

export const useTRStore = create<TRState>()(
  persist(
    (set) => ({
      data: null,
      setData: (newData) => set({ data: newData }),
      clearData: () => set({ data: null }),
    }),
    {
      name: 'tr',
    }
  )
)
