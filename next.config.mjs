/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: new URL('.', import.meta.url).pathname,
  },
  allowedDevOrigins: ['192.168.68.104'],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
}

export default nextConfig
