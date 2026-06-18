import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0A",
        surface: "#141414",
        elevated: "#1C1C1C",
        border: "#242424",
        "border-soft": "#1E1E1E",
        gold: "#C9A96E",
        "gold-soft": "#C9A96E18",
        "gold-mid": "#C9A96E35",
        text: "#EDEAE4",
        muted: "#777777",
        faded: "#444444",
        success: "#52D68A",
        "success-soft": "#52D68A18",
        danger: "#F07070",
        "danger-soft": "#F0707018",
        info: "#6EB0D6",
        "info-soft": "#6EB0D618",
        violet: "#A78BFA",
        "violet-soft": "#A78BFA18"
      },
      borderRadius: {
        xl: "0.75rem",
        lg: "0.5rem",
        md: "0.375rem"
      },
      boxShadow: {
        glow: "0 0 0 1px #C9A96E18, 0 16px 40px #00000055"
      }
    }
  },
  plugins: [animate]
};

export default config;
