const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Block Replit's transient temp dirs from Metro's file-map watcher.
// The FallbackWatcher crashes with ENOENT when these disappear mid-scan.
config.resolver.blockList = [
  /.*[/\\]\.local[/\\]state[/\\].*/,
  /.*[/\\]\.local[/\\]skills[/\\]\.old.*/,
  /.*[/\\]\.git[/\\].*/,
];

module.exports = config;
