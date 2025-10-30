/** @type {import('next').NextConfig} */
const nextConfig = {
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
    return [
      {
        source: '/products',
        destination: 'https://upskin.app/new',
        permanent: true, // 308 permanent redirect
      },
      {
        source: '/products-es',
        destination: 'https://upskin.app/es',
        permanent: true, // 308 permanent redirect
      },
    ]
  },
}

export default nextConfig
