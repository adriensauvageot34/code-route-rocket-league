import {
  existsSync,
  readdirSync,
  readFileSync,
} from "node:fs";
import { basename, dirname, extname, join, relative, sep } from "node:path";
import { createHash } from "node:crypto";

const uiRoot = join("public", "ui");
const manifestPath = join("src", "lib", "home", "homeIllustrationAssets.ts");
const kebabCasePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*\.(?:png|webp)$/;
const intentionallyNamedScanAssets = new Set([
  "car-01 overlay contour-scan.png",
  "car-01 overlay surface-scan.png",
  "car-02 overlay contour-scan.png",
  "car-02 overlay surface-scan.png",
  "car-03 overlay contour-scan.png",
  "car-03 overlay surface-scan.png",
  "fennec-base contour-scan overlay.png",
  "fennec-base headlight glow overlay.png",
  "fennec-base im light overlay.png",
  "fennec-base rear accent glow.png",
  "fennec-base reflection overlay.png",
  "fennec-base surface-scan overlay.png",
  "training-ball Overlay surface-scan.png",
  "training-ball overlay contour-scan.png",
]);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function collectFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = join(directory, entry.name);
    if (entry.isDirectory()) return collectFiles(filePath);
    if (entry.isFile() && entry.name !== ".gitkeep") return [filePath];
    return [];
  });
}

function displayPath(filePath) {
  return relative(uiRoot, filePath).split(sep).join("/");
}

const uiFiles = collectFiles(uiRoot);
const binaryAssetFiles = uiFiles.filter((filePath) =>
  [".png", ".webp"].includes(extname(filePath).toLowerCase()),
);

for (const filePath of uiFiles) {
  assert(
    extname(filePath),
    `UI file is missing an extension: ${displayPath(filePath)}`,
  );
  assert(
    !displayPath(filePath).includes("fenneck"),
    `UI asset still contains the typo fenneck: ${displayPath(filePath)}`,
  );
}

for (const filePath of binaryAssetFiles) {
  const name = basename(filePath);
  assert(
    kebabCasePattern.test(name) ||
      name === "matrice_analyse.png" ||
      intentionallyNamedScanAssets.has(name),
    `UI asset is not lower kebab-case: ${displayPath(filePath)}`,
  );
}

const hashes = new Map();

for (const filePath of binaryAssetFiles) {
  const buffer = readFileSync(filePath);
  const signature = buffer.subarray(0, 12).toString("hex");
  const isPng = signature.startsWith("89504e470d0a1a0a");
  const isWebp =
    signature.startsWith("52494646") &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP";

  assert(
    isPng || isWebp,
    `UI asset has an unexpected signature: ${displayPath(filePath)}`,
  );

  const hash = createHash("sha256").update(buffer).digest("hex");
  const duplicate = hashes.get(hash);
  assert(
    !duplicate,
    `Exact duplicate UI assets found: ${duplicate} and ${displayPath(filePath)}`,
  );
  hashes.set(hash, displayPath(filePath));
}

const trainingObjectManifestPaths = uiFiles.filter((filePath) => {
  const segments = displayPath(filePath).split("/");
  return (
    segments.length === 3 &&
    segments[0] === "training-objects" &&
    segments[2] === "manifest.json"
  );
});

for (const objectManifestPath of trainingObjectManifestPaths) {
  const objectDirectory = dirname(objectManifestPath);
  const objectId = basename(objectDirectory);
  let objectManifest;

  try {
    objectManifest = JSON.parse(readFileSync(objectManifestPath, "utf8"));
  } catch {
    throw new Error(
      `Training object manifest is not valid JSON: ${displayPath(objectManifestPath)}`,
    );
  }

  assert(
    objectManifest?.version === 1,
    `Training object manifest version must be 1: ${displayPath(objectManifestPath)}`,
  );
  assert(
    objectManifest?.objectId === objectId,
    `Training object manifest objectId must match its directory: ${displayPath(objectManifestPath)}`,
  );
  assert(
    objectManifest?.assets &&
      typeof objectManifest.assets === "object" &&
      !Array.isArray(objectManifest.assets),
    `Training object manifest must define assets: ${displayPath(objectManifestPath)}`,
  );

  for (const [role, entry] of Object.entries(objectManifest.assets)) {
    assert(
      entry &&
        typeof entry === "object" &&
        typeof entry.file === "string" &&
        entry.file.length > 0,
      `Training object manifest asset ${role} must reference a file: ${displayPath(objectManifestPath)}`,
    );
    const referencedPath = join(objectDirectory, entry.file);
    const relativeReference = relative(objectDirectory, referencedPath);
    assert(
      relativeReference &&
        !relativeReference.startsWith("..") &&
        !relativeReference.includes(`..${sep}`),
      `Training object manifest asset ${role} must stay in its object directory: ${displayPath(objectManifestPath)}`,
    );
    assert(
      existsSync(referencedPath),
      `Training object manifest asset is missing: ${displayPath(referencedPath)}`,
    );
    assert(
      [".png", ".webp"].includes(extname(referencedPath).toLowerCase()),
      `Training object manifest asset must be PNG or WebP: ${displayPath(referencedPath)}`,
    );
  }
}

const manifest = readFileSync(manifestPath, "utf8");
const manifestPaths = [
  ...manifest.matchAll(/path: "(\/ui\/[^"]+)"/g),
].map((match) => match[1]);

assert(
  manifestPaths.length >= 18,
  "The home illustration asset manifest is unexpectedly small.",
);
assert(
  manifestPaths.includes("/ui/matrice_analyse.png") &&
    !manifestPaths.includes("/ui/terrain_matrice_analyse.png"),
  "Training radar must use the barrier-free tactical matrix.",
);

for (const publicPath of manifestPaths) {
  const filePath = join("public", publicPath.replace(/^\/+/, ""));
  assert(existsSync(filePath), `Manifest path would 404: ${publicPath}`);
}

console.log("UI asset validation OK");
