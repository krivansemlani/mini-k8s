/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // "Field Notes" palette — warm paper + atlantic teal
        paper: {
          DEFAULT: "#F5F1E8",
          soft: "#FAF7F0",
          deep: "#EDE8DB",
        },
        surface: "#FFFFFF",
        ink: {
          DEFAULT: "#1C1B17",
          soft: "#3A3833",
          muted: "#6B675E",
          faint: "#9C978C",
        },
        line: {
          DEFAULT: "#E2DCCC",
          soft: "#EDE8DB",
          strong: "#D0C9B5",
        },
        pine: {
          50: "#E8EFED",
          100: "#C9DAD6",
          300: "#7AA59D",
          500: "#3D7670",
          700: "#2D5F5D",
          900: "#1E4341",
        },
        clay: {
          50: "#F5E9E2",
          300: "#D9A68C",
          500: "#C2896B",
          700: "#9E6B50",
        },
        rust: {
          50: "#F4E3DF",
          500: "#B04A3C",
          700: "#8A3A2E",
        },
        forest: {
          500: "#3D7A5A",
          700: "#2E5E45",
        },
        slate2: {
          500: "#5C6370",
        },
      },
      fontFamily: {
        display: ['"Instrument Serif"', "ui-serif", "Georgia", "serif"],
        sans: ['"Geist"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"Geist Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        "display-xl": ["4.5rem", { lineHeight: "1.02", letterSpacing: "-0.02em" }],
        "display-lg": ["3.25rem", { lineHeight: "1.05", letterSpacing: "-0.015em" }],
      },
      letterSpacing: {
        eyebrow: "0.22em",
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(28,27,23,0.04)",
      },
      animation: {
        "pulse-soft": "pulseSoft 2.4s ease-in-out infinite",
        "fade-up": "fadeUp 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) both",
      },
      keyframes: {
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
