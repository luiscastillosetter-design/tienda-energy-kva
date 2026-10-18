/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ahora va en la raíz, como lo pide Next.js 16.3.8
  allowedDevOrigins: ['192.168.31.239', 'localhost', '10.0.85.2'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

module.exports = nextConfig;