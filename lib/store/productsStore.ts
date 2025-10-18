import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ProductAnalysis {
  name: string
  overallScore: number
  skinType: string
  compatibility: number
  ingredients: Array<{
    name: string
    description: string
  }>
  keyTakeaway: string[]
}

export interface ProductsBase {
  Title: string
  Subtitle?: string
  "Message Prompt"?: string
  Tone?: string
  "Post description and hashtag"?: string
  "Product Analysis"?: ProductAnalysis
}

export type ProductsData = ProductsBase & {
  [key: string]: string | ProductAnalysis | undefined
}

interface ProductsState {
  data: ProductsData | null
  setData: (newData: ProductsData) => void
  clearData: () => void
}

export const useProductsStore = create<ProductsState>()(
  persist(
    (set) => ({
      data: null,
      setData: (newData) => set({ data: newData }),
      clearData: () => set({ data: null }),
    }),
    {
      name: 'products',
    }
  )
) 