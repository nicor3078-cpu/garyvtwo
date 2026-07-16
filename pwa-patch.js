const fs = require("fs");
const path = require("path");

const htmlPath = path.join(__dirname, "dist", "index.html");
let html = fs.readFileSync(htmlPath, "utf8");

const manifestLink = '<link rel="manifest" href="/manifest.json">';
const bodyBg =
  '<style id="pwa-bg">html,body{background-color:#000000;}</style>';

if (!html.includes('rel="manifest"')) {
  html = html.replace("</head>", `${manifestLink}\n${bodyBg}\n</head>`);
  fs.writeFileSync(htmlPath, html, "utf8");
  console.log("pwa-patch: injected manifest link + body background-color");
} else {
  console.log("pwa-patch: already patched, skipping");
}
