/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['images.unsplash.com'],
    unoptimized: true,
  },
  optimizeFonts: false,
  experimental: {
    serverActions: true,
  },
  webpack: (config, { isServer }) => {
    // Optimizaciones de webpack
    config.optimization = {
      ...config.optimization,
      minimize: true,
    };
    return config;
  },
};

module.exports = nextConfig;