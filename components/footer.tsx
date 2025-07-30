import { Mail } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

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
      </div>
    </footer>
  )
}
