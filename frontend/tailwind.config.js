/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Luminous Engine Surface Hierarchy (The "No-Line" Rule Foundation)
        surface: {
          DEFAULT: "#f8f9ff",
          lowest: "#ffffff",
          low: "#eff4ff",
          container: "#e5eeff",
          high: "#dce8fd",
          highest: "#d3e4fe",
        },
        onSurface: {
          DEFAULT: "#0b1c30",
          muted: "#4a5b70",
          subtle: "#73859b",
        },
        'on-surface': {
          DEFAULT: "#0b1c30",
          muted: "#4a5b70",
          subtle: "#73859b",
        },
        // High-Performance Flow Accents: Energy & Water
        luminous: {
          green: "#00d166",
          greenDark: "#006d32",
          blue: "#0070ff",
          blueDark: "#004bb5",
          outline: "rgba(187, 203, 185, 0.25)",
        },
        'luminous-green': "#00d166",
        'luminous-green-dark': "#006d32",
        'luminous-blue': "#0070ff",
        'luminous-blue-dark': "#004bb5",
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#0070ff",
          600: "#005ed9",
          700: "#004bb5",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#0b1c30",
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Geist Mono"', 'monospace'],
      },
      boxShadow: {
        'ambient': '0 20px 40px -15px rgba(11, 28, 48, 0.05)',
        'ambient-float': '0 30px 60px -12px rgba(11, 28, 48, 0.08)',
        'glow-green': '0 0 25px -4px rgba(0, 209, 102, 0.4)',
        'glow-blue': '0 0 25px -4px rgba(0, 112, 255, 0.4)',
        'subtle-1': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'subtle-2': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'panel': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        'xs': '3px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '28px',
      },
    },
  },
  plugins: [],
};
