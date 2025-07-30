import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface NewCharmChatBase {
  Title: string
  Subtitle: string
  "Message Prompt": string
  Tone: string
  "Post description and hashtag": string
}

export type NewCharmChatData = NewCharmChatBase & {
  [key: string]: string
}

interface NewCharmChatState {
  data: NewCharmChatData | null
  setData: (newData: NewCharmChatData) => void
  clearData: () => void
}

export const useNewCharmChatStore = create<NewCharmChatState>()(
  persist(
    (set) => ({
      data: null,
      setData: (newData) => set({ data: newData }),
      clearData: () => set({ data: null }),
    }),
    {
      name: 'newcharmchat',
    }
  )
)
