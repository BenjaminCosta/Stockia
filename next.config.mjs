/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['192.168.68.104'],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
