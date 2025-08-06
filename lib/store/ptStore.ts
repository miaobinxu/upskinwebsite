import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PTBase {
  Title: string
  Subtitle: string
  "Message Prompt": string
  Tone: string
  "Post description and hashtag": string
}

export type PTData = PTBase & {
  [key: string]: string
}

interface PTState {
  data: PTData | null
  setData: (newData: PTData) => void
  clearData: () => void
}

export const usePTStore = create<PTState>()(
  persist(
    (set) => ({
      data: null,
      setData: (newData) => set({ data: newData }),
      clearData: () => set({ data: null }),
    }),
    {
      name: 'pt',
    }
  )
)
