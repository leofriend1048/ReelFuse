const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins.push(new NodePolyfillPlugin());
    }

    // Further custom webpack configuration here

    return config;
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'uwfllbptpdqoovbeizya.supabase.co' },
      { protocol: 'https', hostname: 'image.mux.com' }
    ],
    minimumCacheTTL: 604800, // 7 days in seconds
  },
  typescript: {
    // Existing TypeScript configuration
  },
  // ... any other existing configuration
};

module.exports = nextConfig;
