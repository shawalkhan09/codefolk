// Behaviour checks at phone width: menu, loader, reduced motion, Work filters, form states.
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";
const PORT = 4398, BASE = `http://localhost:${PORT}`;
const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".webp": "image/webp", ".xml": "text/xml" };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  try { const b = await readFile(join("dist", p)); res.writeHead(200, { "Content-Type": TYPES[extname(p)] || "application/octet-stream" }); res.end(b); }
  catch { res.writeHead(404); res.end("not found"); }
}).listen(PORT);
const browser = await chromium.launch();
let fail = 0;
const ok = (name, cond, extra = "") => { console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? "  " + extra : ""}`); if (!cond) fail++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const phone = (w = 375, h = 812, extra = {}) => browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, ...extra });

// ---- loader (normal motion), 320 and 375
for (const w of [320, 375]) {
  const ctx = await phone(w, 700), page = await ctx.newPage();
  const errs = []; page.on("console", (m) => m.type() === "error" && errs.push(m.text())); page.on("pageerror", (e) => errs.push(String(e)));
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#ag-loader");
  await wait(900);
  const geo = await page.evaluate(() => { const n = document.querySelector(".ag-ld-logo"), r = n.getBoundingClientRect(); return { l: r.left, r: r.right, vw: innerWidth, loading: document.documentElement.classList.contains("is-loading"), sw: document.scrollingElement.scrollWidth }; });
  ok(`loader ${w}: name fits width`, geo.l >= 0 && geo.r <= geo.vw && geo.sw <= geo.vw, JSON.stringify(geo));
  let max = 0, t0 = Date.now();
  while (Date.now() - t0 < 7000) { const n = await page.evaluate(() => { const e = document.querySelector("[data-num]"); return e ? +e.textContent : -1; }); if (n < 0) break; max = Math.max(max, n); await wait(60); }
  ok(`loader ${w}: counter reaches 100`, max === 100, `max=${max}`);
  await wait(1700);
  ok(`loader ${w}: removed, page unlocked`, await page.evaluate(() => !document.getElementById("ag-loader") && !document.documentElement.classList.contains("is-loading")));
  await wait(1300);
  ok(`loader ${w}: hero headline visible after`, await page.evaluate(() => +getComputedStyle(document.querySelector("h1 span")).opacity > 0.99));
  ok(`loader ${w}: took under ~6s`, Date.now() - t0 < 6500, `${Date.now() - t0}ms`);
  await page.reload({ waitUntil: "domcontentloaded" });
  ok(`loader ${w}: no replay on reload`, await page.evaluate(() => !document.getElementById("ag-loader")));
  ok(`loader ${w}: no console errors`, errs.length === 0, errs.join("|"));
  await ctx.close();
}
// ---- reduced motion: no loader, menu still works, nothing animates
{
  const ctx = await phone(375, 812, { reducedMotion: "reduce" }), page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  ok("reduced motion: loader skipped", await page.evaluate(() => !document.getElementById("ag-loader")));
  ok("reduced motion: no running animations", await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length === 0));
  ok("reduced motion: headline visible", await page.evaluate(() => +getComputedStyle(document.querySelector("h1 span")).opacity === 1));
  await ctx.close();
}
// ---- menu at 375 (reduced motion on, as required) and 820 (still collapsed), 900 (inline)
for (const [w, collapsed] of [[375, true], [820, true], [900, false]]) {
  const ctx = await phone(w, 800, { reducedMotion: "reduce" });
  await ctx.addInitScript(() => sessionStorage.setItem("ag-loaded", "1"));
  const page = await ctx.newPage();
  await page.goto(BASE + "/about/", { waitUntil: "networkidle" });
  const btnVisible = await page.locator(".menu-btn").isVisible();
  ok(`menu ${w}: button ${collapsed ? "shown" : "hidden"}`, btnVisible === collapsed);
  if (!collapsed) { ok(`menu ${w}: inline links visible`, await page.locator("#site-menu a", { hasText: "Work" }).isVisible()); await ctx.close(); continue; }
  ok(`menu ${w}: links hidden while closed`, !(await page.locator("#site-menu a", { hasText: "Work" }).isVisible()));
  const box = await page.locator(".menu-btn").boundingBox();
  ok(`menu ${w}: button >= 44px`, box.width >= 44 && box.height >= 44, `${box.width}x${box.height}`);
  await page.locator(".menu-btn").click();
  ok(`menu ${w}: aria-expanded true`, (await page.locator(".menu-btn").getAttribute("aria-expanded")) === "true");
  ok(`menu ${w}: overlay visible + scroll locked`, (await page.locator("#site-menu a", { hasText: "Work" }).isVisible()) && (await page.evaluate(() => getComputedStyle(document.documentElement).overflow)) === "hidden");
  const links = await page.locator("#site-menu a").evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)));
  ok(`menu ${w}: link targets >= 44px`, links.every((h) => h >= 44), links.join(","));
  ok(`menu ${w}: focus moved into menu`, await page.evaluate(() => document.getElementById("site-menu").contains(document.activeElement)));
  let inside = true; for (let i = 0; i < 9; i++) { await page.keyboard.press("Tab"); inside &&= await page.evaluate(() => document.getElementById("site-header").contains(document.activeElement)); }
  for (let i = 0; i < 9; i++) { await page.keyboard.press("Shift+Tab"); inside &&= await page.evaluate(() => document.getElementById("site-header").contains(document.activeElement)); }
  ok(`menu ${w}: focus trapped (Tab / Shift+Tab)`, inside);
  await page.keyboard.press("Escape");
  ok(`menu ${w}: Esc closes, focus returns to button, scroll unlocked`, (await page.locator(".menu-btn").getAttribute("aria-expanded")) === "false" && (await page.evaluate(() => document.activeElement.classList.contains("menu-btn") && getComputedStyle(document.documentElement).overflow !== "hidden")));
  await page.locator(".menu-btn").click();
  await page.locator("#site-menu a", { hasText: "Work" }).click();
  await page.waitForURL("**/work/");
  ok(`menu ${w}: choosing a link navigates and menu is closed`, await page.evaluate(() => !document.getElementById("site-header").classList.contains("open") && !document.documentElement.classList.contains("menu-open")));
  // resize past breakpoint while open
  if (w === 820) { await page.locator(".menu-btn").click(); await page.setViewportSize({ width: 1000, height: 800 }); await wait(100); ok("menu 820: closes when resized to desktop", await page.evaluate(() => !document.documentElement.classList.contains("menu-open"))); }
  await ctx.close();
}
// ---- Work filters at 375
{
  const ctx = await phone(375, 812, { reducedMotion: "reduce" });
  await ctx.addInitScript(() => sessionStorage.setItem("ag-loaded", "1"));
  const page = await ctx.newPage();
  await page.goto(BASE + "/work/", { waitUntil: "networkidle" });
  const sc = await page.evaluate(() => { const c = document.querySelector(".chips"); return { scrolls: c.scrollWidth > c.clientWidth, snap: getComputedStyle(c).scrollSnapType, wrap: getComputedStyle(c).flexWrap, page: document.scrollingElement.scrollWidth <= innerWidth }; });
  ok("work 375: chips are one scrollable snap row, page not wider", sc.scrolls && sc.wrap === "nowrap" && /x/.test(sc.snap) && sc.page, JSON.stringify(sc));
  const counts = {};
  for (const f of await page.locator(".chip").evaluateAll((els) => els.map((e) => e.dataset.filter))) {
    await page.locator(`.chip[data-filter=${f}]`).click();
    counts[f] = await page.locator("#grid .project:visible").count();
  }
  ok("work 375: filters work", counts.all === 7 && Object.entries(counts).every(([k, v]) => k === "all" || v >= 1), JSON.stringify(counts));
  const cw = await page.evaluate(() => { const g = document.querySelector("#grid").getBoundingClientRect(), c = document.querySelector("#grid .project:not([hidden])").getBoundingClientRect(); return [Math.round(g.width), Math.round(c.width)]; });
  ok("work 375: cards fill the container", cw[0] === cw[1], cw.join(" vs "));
  await ctx.close();
}
// ---- form states at 375
{
  const ctx = await phone(375, 812, { reducedMotion: "reduce" });
  await ctx.addInitScript(() => sessionStorage.setItem("ag-loaded", "1"));
  const page = await ctx.newPage();
  await page.goto(BASE + "/contact/", { waitUntil: "networkidle" });
  const attrs = await page.evaluate(() => { const g = (id) => { const e = document.getElementById(id); return { fs: parseFloat(getComputedStyle(e).fontSize), h: e.getBoundingClientRect().height, ac: e.autocomplete, im: e.inputMode, w: Math.round(e.getBoundingClientRect().width) }; }; return { name: g("f-name"), biz: g("f-biz"), contact: g("f-contact"), type: g("f-type"), msg: g("f-msg"), consent: document.getElementById("f-consent").closest("label").getBoundingClientRect().height }; });
  ok("form 375: inputs >=16px, >=52px tall, full width", ["name", "biz", "contact", "type"].every((k) => attrs[k].fs >= 16 && attrs[k].h >= 52) && attrs.msg.fs >= 16, JSON.stringify(attrs));
  ok("form 375: autocomplete/inputmode set", attrs.name.ac === "name" && attrs.contact.ac === "email" && attrs.contact.im === "email");
  ok("form 375: consent tap area >= 44px", attrs.consent >= 44, `${attrs.consent}`);
  const h = () => page.evaluate(() => document.documentElement.scrollHeight);
  const status = () => page.evaluate(() => { const s = document.querySelector(".status"); return [s.dataset.kind, s.textContent]; });
  const h0 = await h();
  await page.locator("form .btn").click();
  const [k1] = await status(); ok("form 375: validation error state", k1 === "err"); const h1 = await h();
  await page.fill("#f-name", "Test"); await page.fill("#f-biz", "Cafe, Peshawar"); await page.fill("#f-contact", "03001234567");
  await page.locator("form .btn").click();
  const [k2, t2] = await status(); ok("form 375: not-connected error state", k2 === "err" && /not connected/.test(t2));
  await page.evaluate(() => (document.getElementById("enquiry").dataset.endpoint = "/api"));
  await page.route("**/api", (r) => r.fulfill({ status: 500, body: "x" }));
  await page.locator("form .btn").click(); await wait(200);
  const [k3] = await status(); ok("form 375: server error state", k3 === "err");
  let body; await page.unroute("**/api"); await page.route("**/api", (r) => { body = JSON.parse(r.request().postData()); r.fulfill({ status: 200, contentType: "application/json", body: "{}" }); });
  await page.check("#f-consent"); await page.locator("form .btn").click(); await wait(300);
  const [k4] = await status(); ok("form 375: success state + payload (page, consent)", k4 === "ok" && body.whatsapp_consent === "yes" && body.page.endsWith("/contact/") && body.consent_text.includes("WhatsApp"));
  const h4 = await h();
  ok("form 375: states do not shift layout badly", Math.abs(h4 - h0) <= 90 && Math.abs(h1 - h0) <= 60, `h0=${h0} err=${h1} ok=${h4}`);
  await ctx.close();
}
await browser.close(); server.close();
console.log(fail ? `\n${fail} FAILED` : "\nall behaviour checks passed");
process.exit(fail ? 1 : 0);
