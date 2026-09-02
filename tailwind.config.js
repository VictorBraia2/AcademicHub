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
        brass: "#B4903F",
        rule: "#D8D3C4",
      },
      fontFamily: {
        display: ["Fraunces", "ui-serif", "Georgia", "serif"],
        body: ["IBM Plex Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        card: "2px",
      },
      maxWidth: {
        prose: "68ch",
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
