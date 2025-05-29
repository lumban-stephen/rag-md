// client/tailwind.config.js (ESM)
console.log("--- Tailwind CSS Config (tailwind.config.js) is being loaded ---");

import path from 'path'; // Needed for path.resolve
import { fileURLToPath } from 'url'; // Needed for __filename in ESM

// Import the plugin if you intend to use it
import animatePlugin from 'tailwindcss-animate'; // Changed variable name for clarity

// Recreate __dirname for ESM if you use it in `content` or other path resolutions
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tailwindConfiguration = {
  darkMode: ["class"], // Restored darkMode
  content: [
    path.resolve(__dirname, './src/**/*.{js,ts,jsx,tsx}'),
    path.resolve(__dirname, './index.html')
  ],
  theme: {
    container: { // Restored container
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: { // Merged your original theme extend
      colors: {
        // Your test colors (can be kept or removed if original theme covers needs)
        'test-background': '#3498db',
        'test-text': '#e74c3c',

        // Your original HSL colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: { // Your test font family (can be kept or removed)
        'test-font': ['Georgia', 'serif'],
        // If you have other custom font families, add them here
      },
      borderRadius: { // Restored borderRadius
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: { // Restored keyframes
        "accordion-down": {
          from: { height: "0" }, // Ensured string value
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" }, // Ensured string value
        },
      },
      animation: { // Restored animation
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    animatePlugin // Restored plugin, using the imported variable
  ],
};

console.log("Tailwind Config Content (merged):", JSON.stringify(tailwindConfiguration.content, null, 2)); // Log content paths
export default tailwindConfiguration;