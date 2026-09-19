const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add 'wasm' to assetExts so Metro treats .wasm files as valid assets
config.resolver.assetExts.push('wasm');

module.exports = config;

