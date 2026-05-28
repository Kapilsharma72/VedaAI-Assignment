/** @type {import('next').NextConfig} */
const nextConfig = {
  // 'standalone' output is used for Docker/self-hosted deployments.
  // On Vercel, this is handled automatically — only enable for non-Vercel builds.
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),

  // Forward public environment variables to the browser bundle
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
  },

  images: {
    domains: [
      'localhost',
      'vedaai-api-xdg3.onrender.com',
      'lh3.googleusercontent.com', // Google OAuth avatars
    ],
  },
};

module.exports = nextConfig;
