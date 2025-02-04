const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins.push(new NodePolyfillPlugin());
    }

    // Add a fallback for node: protocol imports
    config.resolve.fallback = { ...config.resolve.fallback, os: require.resolve('os-browserify/browser') };

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