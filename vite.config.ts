import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    nodePolyfills({
      // To exclude specific polyfills, add them to this list.
      // Useful if you only need a subset or if specific polyfills cause issues.
      exclude: [],
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
      // Specific Modules that should be polyfilled.
      globals: {
        Buffer: true, // Ensure Buffer is polyfilled globaly
        global: true,
        process: true,
      },
    }),
  ],
  define: {
    // By default, Vite doesn't include shims for NodeJS/CJS globals.
    // Necessary for some packages that rely on Buffer, process, etc.
    'global': 'globalThis',
    'process.env': {}
  },
  resolve: {
    alias: {
      // You might need aliases if libraries expect specific node modules
      // Example: stream: 'stream-browserify'
    }
  },
  build: {
    target: 'esnext' // Ensure modern JS features are supported
  }
}); 