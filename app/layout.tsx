import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "react-hot-toast"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Product Screenshot Generator",
  description: "Generate beautiful product screenshots for your skincare analysis",
  generator: 'Upskin'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}<Toaster position="top-center" reverseOrder={false} /></body>
    </html>
  )
}
