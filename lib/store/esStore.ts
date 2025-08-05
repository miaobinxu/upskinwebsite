import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface EsBase {
  Title: string
  Subtitle: string
  "Message Prompt": string
  Tone: string
  "Post description and hashtag": string
}

export type EsData = EsBase & {
  [key: string]: string
}

interface EsState {
  data: EsData | null
  setData: (newData: EsData) => void
  clearData: () => void
}

export const useEsStore = create<EsState>()(
  persist(
    (set) => ({
      data: null,
      setData: (newData) => set({ data: newData }),
      clearData: () => set({ data: null }),
    }),
    {
      name: 'es-store',
    }
  )
) 