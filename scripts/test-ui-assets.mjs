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

function readWebpDimensions(buffer, filePath) {
  assert(
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP",
    `Training object asset must be WebP: ${displayPath(filePath)}`,
  );
  const chunk = buffer.subarray(12, 16).toString("ascii");
  if (chunk === "VP8X") {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
    };
  }
  if (chunk === "VP8L") {
    const bits = buffer.readUInt32LE(21);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }
  if (chunk === "VP8 ") {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }
  throw new Error(
    `Unsupported WebP chunk in Training object asset: ${displayPath(filePath)}`,
  );
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
      extname(referencedPath).toLowerCase() === ".webp",
      `Training object manifest asset must be WebP: ${displayPath(referencedPath)}`,
    );
    const sourceSize = entry.sourceSize;
    const crop = entry.crop;
    const outputSize = entry.outputSize;
    assert(
      sourceSize?.width > 0 &&
        sourceSize?.height > 0 &&
        crop?.width > 0 &&
        crop?.height > 0 &&
        outputSize?.width > 0 &&
        outputSize?.height > 0,
      `Training object manifest dimensions must be positive: ${displayPath(objectManifestPath)}#${role}`,
    );
    assert(
      crop.x >= 0 &&
        crop.y >= 0 &&
        crop.x + crop.width <= sourceSize.width &&
        crop.y + crop.height <= sourceSize.height &&
        outputSize.width === crop.width &&
        outputSize.height === crop.height,
      `Training object manifest crop/output mismatch: ${displayPath(objectManifestPath)}#${role}`,
    );
    const decodedSize = readWebpDimensions(
      readFileSync(referencedPath),
      referencedPath,
    );
    assert(
      decodedSize.width === outputSize.width &&
        decodedSize.height === outputSize.height,
      `Training object WebP dimensions do not match outputSize: ${displayPath(referencedPath)}`,
    );
  }
}

const fennecManifestPath = join(
  uiRoot,
  "training-objects",
  "fennec",
  "manifest.json",
);
const fennecManifest = JSON.parse(readFileSync(fennecManifestPath, "utf8"));
const fennecLocalRoles = [
  "base",
  "volumeSurface",
  "volumeContour",
  "tacticalImpact",
  "headlightGlow",
  "rearAccent",
];
assert(
  fennecLocalRoles.every((role) => fennecManifest.assets[role]) &&
    Object.keys(fennecManifest.assets).length === fennecLocalRoles.length,
  "The Fennec manifest must expose exactly its six local GPU roles.",
);
assert(
  !JSON.stringify(fennecManifest).includes("lights-violet-glow-screen"),
  "The full-scene violet screen halo must not be declared as a local Fennec role.",
);

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
