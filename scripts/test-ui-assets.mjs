import { existsSync, readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { createHash } from "node:crypto";

const uiRoot = join("public", "ui");
const manifestPath = join("src", "lib", "home", "homeIllustrationAssets.ts");
const uiFiles = readdirSync(uiRoot).filter((name) => name !== ".gitkeep");
const kebabCasePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*\.(?:png|webp)$/;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

for (const name of uiFiles) {
  assert(extname(name), `UI asset is missing an extension: ${name}`);
  assert(kebabCasePattern.test(name), `UI asset is not lower kebab-case: ${name}`);
  assert(!name.includes("fenneck"), `UI asset still contains the typo fenneck: ${name}`);
}

const hashes = new Map();

for (const name of uiFiles) {
  const filePath = join(uiRoot, name);
  const buffer = readFileSync(filePath);
  const signature = buffer.subarray(0, 12).toString("hex");
  const isPng = signature.startsWith("89504e470d0a1a0a");
  const isWebp = signature.startsWith("52494646") && buffer.subarray(8, 12).toString("ascii") === "WEBP";

  assert(isPng || isWebp, `UI asset has an unexpected signature: ${name}`);

  const hash = createHash("sha256").update(buffer).digest("hex");
  const duplicate = hashes.get(hash);
  assert(!duplicate, `Exact duplicate UI assets found: ${duplicate} and ${name}`);
  hashes.set(hash, name);
}

const manifest = readFileSync(manifestPath, "utf8");
const manifestPaths = [...manifest.matchAll(/path: "(\/ui\/[^"]+)"/g)].map((match) => match[1]);

assert(manifestPaths.length >= 18, "The home illustration asset manifest is unexpectedly small.");

for (const publicPath of manifestPaths) {
  const filePath = join("public", publicPath.replace(/^\/+/, ""));
  assert(existsSync(filePath), `Manifest path would 404: ${publicPath}`);
}

console.log("UI asset validation OK");
