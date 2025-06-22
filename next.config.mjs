/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/internal', 
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

 async redirects() {
    return [];
  },
}

export default nextConfig
