// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix Supabase ESM/CJS resolution issue with Metro bundler
config.resolver.unstable_enablePackageExports = false;

// Ensure Metro can handle .cjs and .mjs files (needed by pdfjs-dist & supabase)
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'cjs',
  'mjs',
];

module.exports = config;
