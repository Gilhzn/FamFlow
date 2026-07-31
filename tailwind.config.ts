import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          0: "var(--surface-0)",
          1: "var(--surface-1)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
        },
        ink: {
          DEFAULT: "var(--ink)",
          dim: "var(--ink-dim)",
          faint: "var(--ink-faint)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          soft: "var(--accent-soft)",
        },
        line: "var(--line)",
        positive: "var(--positive)",
        negative: "var(--negative)",
        warning: "var(--warning)",
        cat: {
          food: "var(--cat-food)",
          leisure: "var(--cat-leisure)",
          fixed: "var(--cat-fixed)",
          mandatory: "var(--cat-mandatory)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.3), 0 0 0 1px var(--line)",
        pop: "0 8px 30px rgba(0,0,0,0.45), 0 0 0 1px var(--line)",
        glow: "0 0 24px var(--accent-soft)",
      },
      animation: {
        // fill-mode backwards (not both/forwards): a filled transform keeps the
        // element a containing block for fixed descendants even at identity.
        "fade-up": "fadeUp 0.35s cubic-bezier(0.16,1,0.3,1) backwards",
        "fade-in": "fadeIn 0.25s ease backwards",
        "scale-in": "scaleIn 0.2s cubic-bezier(0.16,1,0.3,1) backwards",
        "pulse-dot": "pulseDot 2s ease-in-out infinite",
        shimmer: "shimmer 1.6s linear infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          // End at transform:none — a persisted translateY(0) (fill-mode both)
          // would make every animated wrapper a containing block for
          // position:fixed descendants (modals, toasts).
          to: { opacity: "1", transform: "none" },
        },
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "none" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
