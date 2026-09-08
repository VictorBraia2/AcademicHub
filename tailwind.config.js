/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#22241F",
        paper: "#EDEAE0",
        card: "#F8F6F0",
        drawer: "#2B2E2C",
        library: {
          DEFAULT: "#2F4A3C",
          light: "#3F604F",
          dark: "#1F332A",
        },
        stamp: "#9A3324",
        brass: {
          DEFAULT: "#B4903F",
          light: "#CDAD63",
          dark: "#8C6D2B",
        },
        rule: "#D8D3C4",
      },
      fontFamily: {
        display: ["Fraunces", "ui-serif", "Georgia", "serif"],
        body: ["IBM Plex Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        card: "3px",
      },
      maxWidth: {
        prose: "68ch",
      },
      boxShadow: {
        book: "0 1px 2px rgba(34, 36, 31, 0.06), 0 6px 16px -4px rgba(34, 36, 31, 0.12)",
        "book-hover": "0 2px 4px rgba(34, 36, 31, 0.08), 0 12px 24px -6px rgba(34, 36, 31, 0.16)",
        plate: "inset 0 0 0 1px rgba(180, 144, 63, 0.35)",
      },
      keyframes: {
        unfold: {
          "0%": { height: "0px", opacity: "0" },
          "100%": { height: "var(--panel-height, auto)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
