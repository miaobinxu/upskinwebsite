import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ITBase {
  Title: string
  Subtitle: string
  "Message Prompt": string
  Tone: string
  "Post description and hashtag": string
}

export type ITData = ITBase & {
  [key: string]: string
}

interface ITState {
  data: ITData | null
  setData: (newData: ITData) => void
  clearData: () => void
}

export const useITStore = create<ITState>()(
  persist(
    (set) => ({
      data: null,
      setData: (newData) => set({ data: newData }),
      clearData: () => set({ data: null }),
    }),
    {
      name: 'it',
    }
  )
)
