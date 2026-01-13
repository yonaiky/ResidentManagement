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
  // Enable SWC minification for better performance
  swcMinify: true,
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  experimental: {
    serverActions: true,
    optimizeCss: true,
  },
  
  webpack: (config, { isServer }) => {
    // Optimizaciones de webpack
    config.optimization = {
      ...config.optimization,
      minimize: true,
      moduleIds: 'deterministic',
    };
    return config;
  },
};

module.exports = nextConfig;