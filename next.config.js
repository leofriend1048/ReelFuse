/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'uwfllbptpdqoovbeizya.supabase.co' }
    ],
    minimumCacheTTL: 604800, // 7 days in seconds
  },
  typescript: {
    ignoreBuildErrors: true, // Ignore TypeScript build errors
  },
};

module.exports = nextConfig;
