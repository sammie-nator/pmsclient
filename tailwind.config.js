module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#080B10",
        surface: "#0F151E",
        "surface-raised": "#161D28",
        "surface-hover": "#1B2431",
        border: {
          DEFAULT: "#212B39",
          strong: "#2E3A4C",
        },
        signal: {
          DEFAULT: "#22E6C5",
          soft: "#22E6C5",
          deep: "#0FB89A",
        },
        amber: {
          DEFAULT: "#FFB020",
          deep: "#D89012",
        },
        rose: {
          DEFAULT: "#FF5C7A",
          deep: "#E23A5A",
        },
        ink: {
          DEFAULT: "#EAF1F8",
          muted: "#8FA1B3",
          faint: "#56687C",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        sans: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 20px 40px -20px rgba(0,0,0,0.6)",
        glow: "0 0 0 1px rgba(34,230,197,0.25), 0 0 24px -4px rgba(34,230,197,0.35)",
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "28px 28px",
      },
    },
  },
  plugins: [],
};
