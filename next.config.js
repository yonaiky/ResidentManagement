/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['images.unsplash.com'],
    unoptimized: true,
  },
  swcMinify: true,
  compiler: {
    // Strip console noise in production but keep error/warn: every API route
    // reports failures through console.error, and `true` would erase all of it.
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn'] }
        : false,
  },
};

module.exports = nextConfig;
