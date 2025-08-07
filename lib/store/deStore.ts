import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface DEBase {
  Title: string
  Subtitle: string
  "Message Prompt": string
  Tone: string
  "Post description and hashtag": string
}

export type DEData = DEBase & {
  [key: string]: string
}

interface DEState {
  data: DEData | null
  setData: (newData: DEData) => void
  clearData: () => void
}

export const useDEStore = create<DEState>()(
  persist(
    (set) => ({
      data: null,
      setData: (newData) => set({ data: newData }),
      clearData: () => set({ data: null }),
    }),
    {
      name: 'de',
    }
  )
)
