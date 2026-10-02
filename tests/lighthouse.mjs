// Lighthouse mobile (default = Moto G Power emulation, simulated slow 4G, 4x CPU slowdown). Run after `npm run build:preview`.
import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";
const PORT = 4397, BASE = `http://localhost:${PORT}`;
const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".webp": "image/webp", ".xml": "text/xml" };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  try { const b = await readFile(join("dist", p)); res.writeHead(200, { "Content-Type": TYPES[extname(p)] || "application/octet-stream" }); res.end(b); }
  catch { res.writeHead(404); res.end("not found"); }
}).listen(PORT);
const chrome = await launch({ chromePath: chromium.executablePath(), chromeFlags: ["--headless=new", "--no-sandbox"] });
const pages = process.argv.slice(2).length ? process.argv.slice(2) : ["/", "/restaurants/", "/work/", "/work/restaurant-one/", "/about/", "/contact/", "/privacy/"];
for (const p of pages) {
  const r = await lighthouse(BASE + p, { port: chrome.port, formFactor: "mobile", throttling: { cpuSlowdownMultiplier: 4, rttMs: 150, throughputKbps: 1638.4, requestLatencyMs: 562.5, downloadThroughputKbps: 1474.56, uploadThroughputKbps: 675 }, screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false }, onlyCategories: ["performance", "accessibility", "best-practices", "seo"] });
  const c = r.lhr.categories, a = r.lhr.audits;
  const fails = Object.values(a).filter((x) => x.score !== null && x.score < 0.9 && x.scoreDisplayMode !== "informative" && x.scoreDisplayMode !== "notApplicable" && x.scoreDisplayMode !== "manual").map((x) => `${x.id}(${x.score})`);
  const cc = a["color-contrast"]; if (cc.score !== 1) console.log("   contrast:", (cc.details?.items || []).slice(0, 8).map((i) => i.node?.snippet?.slice(0, 70) + " " + (i.node?.explanation || "").match(/ratio of [\d.]+/)?.[0]).join("\n             "));
  console.log(`${p}  perf ${Math.round(c.performance.score * 100)}  a11y ${Math.round(c.accessibility.score * 100)}  bp ${Math.round(c["best-practices"].score * 100)}  seo ${Math.round(c.seo.score * 100)}  LCP ${(a["largest-contentful-paint"].numericValue / 1000).toFixed(2)}s  CLS ${a["cumulative-layout-shift"].numericValue.toFixed(3)}  TBT ${Math.round(a["total-blocking-time"].numericValue)}ms  FCP ${(a["first-contentful-paint"].numericValue/1000).toFixed(2)}s\n    issues: ${fails.join(", ") || "none"}`);
}
await chrome.kill(); server.close();
