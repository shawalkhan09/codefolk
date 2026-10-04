// Renders public/brand/og.png (1200x630). Run: node scripts/make-og.mjs
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const logo = readFileSync("public/brand/codefolk-logo-for-dark.svg", "utf8").replace(/ width="\d+" height="\d+"/, ' width="520"');
const font = pathToFileURL("node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2").href;
const html = `<style>
@font-face{font-family:SG;src:url("${font}");font-weight:300 700}
html,body{margin:0;width:1200px;height:630px;background:#060F0F}
body{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:44px}
p{margin:0;font:300 40px SG,sans-serif;letter-spacing:-.02em;color:#EAF4F2}
</style>${logo}<p>Software that fits your business</p>`;
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: "public/brand/og.png" });
await b.close();
