import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");
const svg = readFileSync(join(publicDir, "icon.svg"));

const sizes = [
  ["logo192.png", 192],
  ["logo512.png", 512],
  ["apple-touch-icon.png", 180],
  ["favicon-32x32.png", 32],
];

for (const [name, size] of sizes) {
  await sharp(svg).resize(size, size).png().toFile(join(publicDir, name));
}

await sharp(svg)
  .resize(32, 32)
  .toFormat("png")
  .toFile(join(publicDir, "favicon.ico"));

console.log("Generated StackDesk icons in public/");
