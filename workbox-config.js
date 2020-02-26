module.exports = {
  "globDirectory": "docs/",
  "globPatterns": [
    "**/*.{png,css,json,js,ico,html,xml,webmanifest,md,wasm,ttf}"
  ],
  "swDest": "docs/sw.js",
  "maximumFileSizeToCacheInBytes": 15000000,
  "navigateFallback": "index.html"
};