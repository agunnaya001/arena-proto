/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0e27',
        foreground: '#e4e6eb',
        card: '#161b33',
        'card-foreground': '#e4e6eb',
        primary: '#00d4ff',
        'primary-foreground': '#0a0e27',
        secondary: '#7c3aed',
        'secondary-foreground': '#f8fafc',
        accent: '#ff1493',
        'accent-foreground': '#0a0e27',
        destructive: '#ef4444',
        'destructive-foreground': '#fafafa',
        muted: '#6b7280',
        'muted-foreground': '#9ca3af',
        border: '#1e293b',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
