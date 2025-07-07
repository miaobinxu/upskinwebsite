// store/useCharmChatStore.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'


export interface CharmChatBase {
  Title: string
  Subtitle: string
  "Message Prompt": string
  Tone: string
  "Post description and hashtag": string
}

export type CharmChatData = CharmChatBase & {
  [key: string]: string
}

interface CharmChatState {
  data: CharmChatData | null
  setData: (newData: CharmChatData) => void
  clearData: () => void
}

export const useCharmChatStore = create<CharmChatState>()(
  persist(
    (set) => ({
      data: null,
      setData: (newData) => set({ data: newData }),
      clearData: () => set({ data: null }),
    }),
    {
      name: 'charmchat',
    }
  )
)
