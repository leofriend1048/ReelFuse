/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'uwfllbptpdqoovbeizya.supabase.co' }
    ],
    minimumCacheTTL: 604800, // 7 days in seconds
  },
  typescript: {
    // Removed the line that ignores TypeScript build errors
  },
};

module.exports = nextConfig;
