// store/useDontSayStore.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'


export interface DontSayBase {
  Title: string
  Subtitle: string
  "Message Prompt": string
  Tone: string
  "Post description and hashtag": string
}

export type DontSayData = DontSayBase & {
  [key: string]: string
}

interface DontSayState {
  data: DontSayData | null
  setData: (newData: DontSayData) => void
  clearData: () => void
}

export const useDontSayStore = create<DontSayState>()(
  persist(
    (set) => ({
      data: null,
      setData: (newData) => set({ data: newData }),
      clearData: () => set({ data: null }),
    }),
    {
      name: 'dontsay',
    }
  )
) 