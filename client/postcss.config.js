console.log("--- PostCSS Config (postcss.config.js) is being loaded ---");
// client/postcss.config.js (ESM)
import path from 'path';
import { fileURLToPath } from 'url';

// Import the plugin functions directly
import tailwindcssPlugin from 'tailwindcss'; // Renamed for clarity, it's the plugin initializer
import autoprefixerPlugin from 'autoprefixer'; // Renamed for clarity

// Recreate __dirname for ESM, as it's used to resolve the tailwind.config.js path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  plugins: [
    // Call the tailwindcss plugin function, passing its options object
    tailwindcssPlugin({ config: path.resolve(__dirname, 'tailwind.config.js') }),
    // Or simpler if in the same dir: tailwindcssPlugin({ config: './tailwind.config.js' }),

    // Call the autoprefixer plugin function (often doesn't need options)
    autoprefixerPlugin, // Or autoprefixerPlugin({}) if it expects to be called
  ]
};