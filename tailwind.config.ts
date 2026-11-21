import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { ink: "#12102B", periwinkle: "#8F9BFF", mint: "#7CF0C9", peach: "#FFB48A", bone: "#EDEAFF" },
      fontFamily: { display: ["var(--font-display)"], body: ["var(--font-body)"] },
    },
  },
  plugins: [],
} satisfies Config;
