// Scans dist/ for unresolved placeholders (elements marked data-ph). Warns; fails when STRICT=1.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const found = [];
const walk = (d) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f.endsWith(".html")) {
      const html = readFileSync(p, "utf8");
      const hits = [...html.matchAll(/<(?:mark|span)[^>]*\bdata-ph\b[^>]*>(.*?)<\/(?:mark|span)>/g)].map((m) => m[1]);
      if (hits.length) found.push([p, hits]);
    }
  }
};
walk("dist");

const problems = [];
if (found.length) problems.push(`${found.reduce((n, [, h]) => n + h.length, 0)} placeholder(s) in ${found.length} page(s):\n` + found.map(([p, h]) => `  ${p}: ${[...new Set(h)].slice(0, 6).join(" | ")}`).join("\n"));
if (!process.env.PUBLIC_FORM_ENDPOINT) problems.push("PUBLIC_FORM_ENDPOINT is not set: the contact form will show its error state.");
if (!process.env.SITE_URL) problems.push("SITE_URL is not set: sitemap and canonical URLs use https://example.com.");

if (problems.length) {
  const strict = process.env.STRICT === "1";
  console.error(`\n${strict ? "ERROR" : "WARNING"}: not ready for production\n${problems.join("\n")}\n`);
  if (strict) process.exit(1);
}
