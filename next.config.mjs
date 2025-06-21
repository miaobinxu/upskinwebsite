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
}

export default nextConfig


// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   eslint: {
//     ignoreDuringBuilds: true,
//   },
//   typescript: {
//     ignoreBuildErrors: true,
//   },
//   images: {
//     unoptimized: true,
//   },

//   async redirects() {
//     return [
//       {
//         source: '/',
//         destination: '/internal',
//         permanent: false,
//       },
//       {
//         source: '/:path((?!internal).*)',
//         destination: '/internal',
//         permanent: false,
//       },
//     ];
//   },
// }

// export default nextConfig
