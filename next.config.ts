/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  swcMinify: true,
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  distDir: '.next',
  experimental: {
    serverActions: true,
  }
};

export default nextConfig;
