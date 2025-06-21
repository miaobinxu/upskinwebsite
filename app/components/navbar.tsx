"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, Settings, User } from "lucide-react"
import Image from "next/image"

const navItems = [
  { label: "Home", href: "/" },
]

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => pathname === href

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center cursor-pointer">
            <Link href="/">
              <Image
                src="/upskin-logo.png"
                alt="Upskin Logo"
                height={50}
                width={50}
                className="h-10 w-10 object-cover rounded-xl"
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={`transition-colors ${isActive(href)
                  ? "text-[#6D9886] font-semibold border-b-2 border-[#6D9886] pb-1"
                  : "text-gray-600 hover:text-[#6D9886]"
                  }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="text-gray-600 hover:text-[#6D9886]">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-600 hover:text-[#6D9886]">
              <User className="h-5 w-5" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-600">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-4">
            <div className="flex flex-col space-y-4">
              {navItems.map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className={`transition-colors px-2 ${isActive(href)
                    ? "text-[#6D9886] font-semibold border-l-4 border-[#6D9886] pl-2"
                    : "text-gray-600 hover:text-[#6D9886]"
                    }`}
                >
                  {label}
                </Link>
              ))}
              <div className="flex items-center space-x-4 px-2 pt-4 border-t border-gray-100">
                <Button variant="ghost" size="icon" className="text-gray-600 hover:text-[#6D9886]">
                  <Settings className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-gray-600 hover:text-[#6D9886]">
                  <User className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
