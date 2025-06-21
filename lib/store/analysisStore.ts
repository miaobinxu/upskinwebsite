import { create } from "zustand"
import { persist } from "zustand/middleware"

interface Ingredient {
  name: string
  description: string
}

interface ScreenshotResult {
  name: string
  overallScore: {
    name: string
    value: number
  }
  fitScore: {
    name: string
    value: number
  }
  Ingredients: Ingredient[]
  keyTakeaway: string[]
}

interface ScreenshotState {
  result: ScreenshotResult | null
  image: string | null
  setResult: (data: ScreenshotResult) => void
  setImage: (img: string) => void
  reset: () => void
}

export const useScreenshotStore = create<ScreenshotState>()(
  persist(
    (set) => ({
      result: null,
      image: null,
      setResult: (data) => set({ result: data }),
      setImage: (img) => set({ image: img }),
      reset: () => set({ result: null, image: null }),
    }),
    {
      name: "screenshot-analysis-storage",
    }
  )
)
