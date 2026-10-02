/** @type {import('tailwindcss').Config} */
import daisyui from "daisyui";

export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        spotify: {
          primary: "#1DB954", // Spotify green
          "primary-content": "#ffffff",
          secondary: "#191414",
          "secondary-content": "#ffffff",
          accent: "#1ed760",
          "accent-content": "#ffffff",
          neutral: "#1f1f1f",
          "neutral-content": "#e5e5e5",
          "base-100": "#ffffff",
          "base-200": "#f5f5f5",
          "base-300": "#e5e5e5",
          "base-content": "#1a1a1a",
          info: "#3b82f6",
          success: "#22c55e",
          warning: "#f59e0b",
          error: "#ef4444",
          "--rounded-box": "0.75rem",
          "--rounded-btn": "9999px",
          "--rounded-badge": "9999px",
        },
        "spotify-dark": {
          primary: "#1DB954",
          "primary-content": "#ffffff",
          secondary: "#0a0a0a",
          "secondary-content": "#ffffff",
          accent: "#1ed760",
          "accent-content": "#ffffff",
          neutral: "#1f1f1f",
          "neutral-content": "#e5e5e5",
          "base-100": "#121212",
          "base-200": "#181818",
          "base-300": "#282828",
          "base-content": "#ffffff",
          info: "#60a5fa",
          success: "#22c55e",
          warning: "#fbbf24",
          error: "#f87171",
          "--rounded-box": "0.75rem",
          "--rounded-btn": "9999px",
          "--rounded-badge": "9999px",
        },
      },
    ],
  },
};
