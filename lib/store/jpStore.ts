import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface JPBase {
  Title: string
  Subtitle: string
  "Message Prompt": string
  Tone: string
  "Post description and hashtag": string
}

export type JPData = JPBase & {
  [key: string]: string
}

interface JPState {
  data: JPData | null
  setData: (newData: JPData) => void
  clearData: () => void
}

export const useJPStore = create<JPState>()(
  persist(
    (set) => ({
      data: null,
      setData: (newData) => set({ data: newData }),
      clearData: () => set({ data: null }),
    }),
    {
      name: 'jp',
    }
  )
)
