// Responsive audit: node tests/responsive.mjs  (needs `npm run build:preview` first; starts its own preview server)
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";

const PORT = 4399, BASE = `http://localhost:${PORT}`;
const SIZES = [[320, 568], [360, 740], [375, 812], [390, 844], [414, 896], [600, 900], [768, 1024], [820, 1180], [1024, 768], [1280, 800], [1440, 900], [1920, 1080], [2560, 1440], [667, 375], [640, 512], [320, 256]];
// last two = 200% and 400% browser zoom of a 1280x1024 window (WCAG 1.4.10)
const PAGES = ["/", "/restaurants/", "/work/", "/work/restaurant-one/", "/about/", "/contact/", "/privacy/"];
const SHOT_W = new Set([375, 768, 1440]);

const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".webp": "image/webp", ".xml": "text/xml" };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  try { const b = await readFile(join("dist", p)); res.writeHead(200, { "Content-Type": TYPES[extname(p)] || "application/octet-stream" }); res.end(b); }
  catch { res.writeHead(404); res.end("not found"); }
}).listen(PORT);

// runs in the page
const audit = () => {
  const out = { overflow: [], tap: [], text: [], micro: [], clipped: [], overlap: [] };
  const vw = innerWidth;
  const se = document.scrollingElement;
  if (se.scrollWidth > vw) out.overflow.push(`scrollWidth ${se.scrollWidth} > ${vw}`);
  const vis = (e) => { if (e.closest("details:not([open])") && !e.closest("summary")) return false; const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none"; };
  const desc = (e) => e.tagName.toLowerCase() + (e.className && typeof e.className === "string" ? "." + e.className.trim().split(/\s+/).join(".") : "") + `("${(e.textContent || "").trim().slice(0, 28)}")`;
  const decorative = (e) => !!e.closest('[aria-hidden="true"], .hp, #ag-loader');
  // tap targets
  document.querySelectorAll("a[href], button, select, input:not([type=hidden]):not(.hp), textarea, summary").forEach((e) => {
    if (decorative(e) || !vis(e)) return;
    if (e.matches('input[type=checkbox]')) e = e.closest("label") || e;
    const inline = e.tagName === "A" && e.closest("p, li") && getComputedStyle(e).display === "inline"; // WCAG exempts inline text links
    if (inline) return;
    const r = e.getBoundingClientRect();
    if (r.height < 43.5 || r.width < 43.5) out.tap.push(`${desc(e)} ${Math.round(r.width)}x${Math.round(r.height)}`);
  });
  // text sizes
  const CAPTION = ".note,.eyebrow,.tag,.client,.outcome,.sample,.fine,.small,.l,.days,.role,.badge,.proof,.status,.num,.top,figcaption,cite,dt,footer,.pill,.chip,label,button,a,summary,.n,.wordmark,.menu-btn";
  document.querySelectorAll("p, li, dd").forEach((e) => {
    if (decorative(e) || !vis(e) || e.matches(CAPTION) || e.closest(CAPTION)) return;
    if (!(e.textContent || "").trim()) return;
    const fs = parseFloat(getComputedStyle(e).fontSize);
    if (fs < 15.99) out.text.push(`${desc(e)} ${fs}px`);
  });
  document.querySelectorAll("body *").forEach((e) => {
    if (decorative(e) || !vis(e)) return;
    if (![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return;
    const fs = parseFloat(getComputedStyle(e).fontSize);
    if (fs < 11.99) out.micro.push(`${desc(e)} ${fs}px`);
  });
  // clipped text + overlap
  const leaves = [...document.querySelectorAll("body *")].filter((e) => vis(e) && !decorative(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && !e.matches("script,style,option"));
  const scrollAncestor = (e) => { for (let p = e.parentElement; p; p = p.parentElement) { const s = getComputedStyle(p); if (/(auto|scroll)/.test(s.overflowX)) return true; } return false; };
  leaves.forEach((e) => {
    const r = e.getBoundingClientRect();
    if (!scrollAncestor(e) && (r.right > vw + 1 || r.left < -1)) out.clipped.push(`${desc(e)} outside viewport [${Math.round(r.left)},${Math.round(r.right)}]`);
    for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (/(hidden|clip)/.test(s.overflowX + s.overflowY) && !/(auto|scroll)/.test(s.overflowX)) {
        const pr = p.getBoundingClientRect();
        if (r.right > pr.right + 1 || r.left < pr.left - 1 || r.bottom > pr.bottom + 1 || r.top < pr.top - 1) out.clipped.push(`${desc(e)} clipped by ${desc(p)}`);
        break;
      }
    }
    if (e.scrollWidth > e.clientWidth + 1 && /(hidden|clip)/.test(getComputedStyle(e).overflowX)) out.clipped.push(`${desc(e)} own text clipped`);
  });
  for (let i = 0; i < leaves.length; i++) for (let j = i + 1; j < leaves.length; j++) {
    const a = leaves[i], b = leaves[j];
    if (a.contains(b) || b.contains(a)) continue;
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    const ox = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), oy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
    if (ox > 2 && oy > 2) {
      const pa = getComputedStyle(a).position, pb = getComputedStyle(b).position;
      if (pa === "fixed" || pb === "fixed") continue;
      out.overlap.push(`${desc(a)} x ${desc(b)}`);
    }
  }
  return out;
};

const browser = await chromium.launch();
let fails = 0;
const rows = [];
for (const [w, h] of SIZES) {
  const zoom = w === 640 || (w === 320 && h === 256);
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: "reduce", deviceScaleFactor: zoom ? 2 : 1, hasTouch: w < 1024, isMobile: w < 800 && !zoom });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("ag-loaded", "1"); } catch {} });
  let bad = 0;
  for (const path of PAGES) {
    const page = await ctx.newPage();
    const errs = [];
    page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
    page.on("pageerror", (e) => errs.push(String(e)));
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const res = await page.evaluate(audit);
    const probs = Object.entries(res).flatMap(([k, v]) => [...new Set(v)].slice(0, 6).map((x) => `${k}: ${x}`));
    errs.forEach((e) => probs.push("console: " + e));
    if (SHOT_W.has(w)) await page.screenshot({ path: `tests/shots/${w}${path.replace(/\W+/g, "_")}.png`, fullPage: true });
    if (probs.length) { bad += probs.length; console.log(`\n[FAIL] ${w}x${h} ${path}\n  ` + probs.join("\n  ")); }
    await page.close();
  }
  fails += bad;
  rows.push(`${w}x${h}${zoom ? " (zoom)" : ""}: ${bad ? bad + " problem(s)" : "pass"}`);
  await ctx.close();
}
await browser.close();
server.close();
console.log("\n" + rows.join("\n") + `\n\nTOTAL problems: ${fails}`);
process.exit(fails ? 1 : 0);
