/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'uwfllbptpdqoovbeizya.supabase.co' },
      { protocol: 'https', hostname: 'image.mux.com' }
    ],
    minimumCacheTTL: 604800, // 7 days in seconds
  },
  typescript: {
    // Removed the line that ignores TypeScript build errors
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "async_hooks": false,
    };
    return config;
  },
};

module.exports = nextConfig;