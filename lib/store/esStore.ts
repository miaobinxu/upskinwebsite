import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ESBase {
  Title: string
  Subtitle: string
  "Message Prompt": string
  Tone: string
  "Post description and hashtag": string
}

export type ESData = ESBase & {
  [key: string]: string
}

interface ESState {
  data: ESData | null
  setData: (newData: ESData) => void
  clearData: () => void
}

export const useESStore = create<ESState>()(
  persist(
    (set) => ({
      data: null,
      setData: (newData) => set({ data: newData }),
      clearData: () => set({ data: null }),
    }),
    {
      name: 'es',
    }
  )
)
