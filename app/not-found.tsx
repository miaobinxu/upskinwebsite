// app/not-found.tsx

"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F7F7] px-4 text-center">
      <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
      <h1 className="text-4xl font-bold text-[#393E46] mb-2">Page Not Found</h1>
      <p className="text-gray-600 mb-6">Sorry, we couldn’t find the page you’re looking for.</p>
    </div>
  )
}
