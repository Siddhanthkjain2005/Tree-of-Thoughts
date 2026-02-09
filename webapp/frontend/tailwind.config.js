/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}", "*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#030306",
        surface: "rgba(8,8,22,0.6)",
        "surface-solid": "#080816",
        fg: "#e4e4ef",
        "fg-muted": "#9191b0",
        "fg-dim": "#6060a0",
        neon: "#818cf8",
        cyan: "#22d3ee",
        emerald: "#34d399",
        amber: "#fbbf24",
        rose: "#fb7185",
        violet: "#a78bfa",
        border: "rgba(129,140,248,0.08)",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Space Grotesk', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '28px',
      },
      animation: {
        'fade-up': 'fadeUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) both',
        'float': 'float 6s ease-in-out infinite',
        'breathe': 'breathe 3.5s ease-in-out infinite',
        'count-in': 'countIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        'shimmer': 'shimmerFlow 2s linear infinite',
      },
      boxShadow: {
        'glow-neon': '0 0 50px rgba(129,140,248,0.18), 0 0 120px rgba(129,140,248,0.08)',
        'glow-cyan': '0 0 50px rgba(34,211,238,0.18), 0 0 120px rgba(34,211,238,0.08)',
        'glow-emerald': '0 0 50px rgba(52,211,153,0.18), 0 0 120px rgba(52,211,153,0.08)',
        'glow-amber': '0 0 50px rgba(251,191,36,0.18), 0 0 120px rgba(251,191,36,0.08)',
      },
    },
  },
  plugins: [],
}
