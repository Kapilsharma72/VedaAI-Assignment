import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sidebar: {
          DEFAULT: '#1a1f2e',
        },
        accent: {
          DEFAULT: '#6366f1',
          hover: '#4f46e5',
        },
        main: {
          DEFAULT: '#f8fafc',
        },
      },
      backgroundColor: {
        sidebar: '#1a1f2e',
        accent: '#6366f1',
        main: '#f8fafc',
      },
      borderRadius: {
        card: '0.75rem',
      },
    },
  },
  plugins: [],
};

export default config;
