import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ProductsBase {
  Title: string
  Subtitle?: string
  "Message Prompt"?: string
  Tone?: string
  "Post description and hashtag"?: string
}

export type ProductsData = ProductsBase & {
  [key: string]: string
}

interface ProductsState {
  data: ProductsData | null
  setData: (newData: ProductsData) => void
  clearData: () => void
}

export const useProductsStoreEs = create<ProductsState>()(
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

