// Generates responsive WebP variants for homepage work covers to cut multi-MB PNG payload.
import sharp from "sharp";
import { readdirSync, statSync } from "node:fs";
import { join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = fileURLToPath(new URL("../public/work/", import.meta.url));
const WIDTHS = [640, 1280, 1920];

const files = readdirSync(SRC).filter((f) => f.endsWith(".png") && !f.includes("-erp"));
for (const f of files) {
  const base = basename(f, ".png");
  const inPath = join(SRC, f);
  const meta = await sharp(inPath).metadata();
  for (const w of WIDTHS) {
    const target = Math.min(w, meta.width);
    const out = join(SRC, `${base}-${target}.webp`);
    await sharp(inPath).resize({ width: target }).webp({ quality: 78 }).toFile(out);
    console.log(base, target, statSync(out).size);
  }
}
console.log("done");
