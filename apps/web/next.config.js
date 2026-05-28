/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  // Forward public environment variables to the browser bundle
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
  },

  images: {
    domains: [
      'localhost',
      // Add your production API domain here, e.g. 'api.vedaai.com'
    ],
  },
};

module.exports = nextConfig;
