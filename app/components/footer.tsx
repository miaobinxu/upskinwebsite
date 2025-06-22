import { Mail } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex mb-2 items-center cursor-pointer">
              <Image
                src="/internal/upskin-logo.png"
                alt="Upskin Logo"
                height={50}
                width={50}
                className="h-16 w-16 object-cover rounded-xl"
                priority
              />
            </div>
            <p className="text-gray-600 mb-6 max-w-md">
              Advanced skincare analysis and product screenshot generation tool for beauty professionals and brands.
            </p>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                <Link
                  href="mailto:nativfeedback@gmail.com"
                  className="text-[#6D9886] underline hover:text-[#518c74]"
                >
                  nativfeedback@gmail.com
                </Link>
              </div>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4" style={{ color: "#393E46" }}>
              Product
            </h3>
            <ul className="space-y-3">
              <li>
                <p className="text-gray-600 hover:text-[#6D9886] transition-colors text-sm">
                  Screenshot Generator
                </p>
              </li>
              <li>
                <p className="text-gray-600 hover:text-[#6D9886] transition-colors text-sm">
                  Skin Analysis
                </p>
              </li>
              <li>
                <p className="text-gray-600 hover:text-[#6D9886] transition-colors text-sm">
                  Templates
                </p>
              </li>
              <li>
                <p className="text-gray-600 hover:text-[#6D9886] transition-colors text-sm">
                  API Access
                </p>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4" style={{ color: "#393E46" }}>
              Support
            </h3>
            <ul className="space-y-3">
              <li>
                <p className="text-gray-600 hover:text-[#6D9886] transition-colors text-sm">
                  Documentation
                </p>
              </li>
              <li>
                <p className="text-gray-600 hover:text-[#6D9886] transition-colors text-sm">
                  Help Center
                </p>
              </li>
              <li>
                <p className="text-gray-600 hover:text-[#6D9886] transition-colors text-sm">
                  Contact Us
                </p>
              </li>
              <li>
                <p className="text-gray-600 hover:text-[#6D9886] transition-colors text-sm">
                  Status
                </p>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">© 2024 Upskin. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <Link href="/privacypolicy" className="text-gray-500 hover:text-[#6D9886] text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link href="/termsofservice" className="text-gray-500 hover:text-[#6D9886] text-sm transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
