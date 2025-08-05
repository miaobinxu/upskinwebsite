import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface esBase {
  Title: string
  Subtitle: string
  "Message Prompt": string
  Tone: string
  "Post description and hashtag": string
}

export type esData = esBase & {
  [key: string]: string
}

interface esState {
  data: esData | null
  setData: (newData: esData) => void
  clearData: () => void
}

export const useesStore = create<esState>()(
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
