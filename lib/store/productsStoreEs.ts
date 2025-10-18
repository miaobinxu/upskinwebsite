import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ProductAnalysisEs {
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

export interface ProductsBaseEs {
  Title: string
  Subtitle?: string
  "Message Prompt"?: string
  Tone?: string
  "Post description and hashtag"?: string
  "Product Analysis"?: ProductAnalysisEs
}

export type ProductsDataEs = ProductsBaseEs & {
  [key: string]: string | ProductAnalysisEs | ProductContentEs | undefined
}

export interface ProductContentEs {
  name?: string
  emoji?: string
  score?: string
  points?: string[]
}

interface ProductsStateEs {
  data: ProductsDataEs | null
  setData: (newData: ProductsDataEs) => void
  clearData: () => void
}

export const useProductsStoreEs = create<ProductsStateEs>()(
  persist(
    (set) => ({
      data: null,
      setData: (newData) => set({ data: newData }),
      clearData: () => set({ data: null }),
    }),
    {
      name: 'products-es',
    }
  )
)

