const fs = require("fs").promises;
const path = require("path");
const packageJson = require("./package.json");
const pluginJson = require("./ladon-plugin.json");
const distPath = path.resolve(__dirname, "dist");

/**
 * Collect every `node_modules` directory on the path from this package up to the
 * filesystem root. With npm workspaces dependencies are often *hoisted* to the
 * workspace root (e.g. `../node_modules`) instead of living next to this package
 * (`./node_modules`); walking up keeps this build working in both layouts.
 */
function collectNodeModulesDirs(startDir = __dirname) {
  const dirs = [];
  let current = startDir;
  for (;;) {
    dirs.push(path.join(current, "node_modules"));
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return dirs;
}

const candidateNodeModulesDirs = collectNodeModulesDirs();

function sanitizedVersion(key) {
  const version = packageJson["dependencies"][key];
  if (typeof version !== "string") {
    throw new Error(
      `Dependency "${key}" must declare a string version range, got ${JSON.stringify(version)}`
    );
  }
  return version.replace(/[^a-zA-Z0-9.]/g, "");
}

/**
 * Resolve the package directory for `key` in the first `node_modules` that contains
 * it. Returns undefined if the dependency is missing everywhere (so it can be skipped,
 * matching the historic skip-on-missing behaviour).
 */
async function resolveModuleDir(key) {
  for (const base of candidateNodeModulesDirs) {
    const candidate = path.join(base, key);
    try {
      const stats = await fs.stat(candidate);
      if (stats.isDirectory()) return candidate;
    } catch {
      // not present in this node_modules – try the next one
    }
  }
  return undefined;
}

/**
 * Iterate over all the dependencies and copy them to dist folder
 */
async function iterateAndCopyModules() {
  for (const key in packageJson["dependencies"]) {
    const moduleVersion = sanitizedVersion(key);
    const srcPath = await resolveModuleDir(key);
    if (!srcPath) {
      console.warn(
        `[build.js] dependency "${key}" not found (${candidateNodeModulesDirs.join(", ")}); skipped.`
      );
      continue;
    }
    const destPath = path.join(distPath, key, moduleVersion);
    await fs.cp(srcPath, destPath, { recursive: true });
  }
}

/**
 * Generate import map for all the dependencies
 */
async function generateImportMap() {
  let json = { imports: {} };

  const jsonFileName = `importmap.json`;
  const jsonPath = path.join(distPath, jsonFileName);

  for (const key in packageJson["dependencies"]) {
    const moduleVersion = sanitizedVersion(key);
    const { imports } = json;

    json["imports"] = {
      ...imports,
      [`${key}/`]: `${pluginJson["deployTarget"].replaceAll(
        "_",
        ""
      )}dist/${key}/${moduleVersion}/`,
    };
  }

  await fs.writeFile(jsonPath, JSON.stringify(json, null, 2));
}

iterateAndCopyModules()
  .then(() => generateImportMap())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
