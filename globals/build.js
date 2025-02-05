const fs = require("fs").promises;
const path = require("path");
const packageJson = require("./package.json");
const pluginJson = require("./ladon-plugin.json");
const distPath = path.resolve(__dirname, "dist");
const nodeModulesPath = path.resolve(__dirname, "node_modules");

function sanitizedVersion(key) {
  return packageJson["dependencies"][key].replace(/[^a-zA-Z0-9.]/g, "");
}

/**
 * Iterate over all the dependencies and copy them to dist folder
 */
async function iterateAndCopyModules() {
  for (const key in packageJson["dependencies"]) {
    const moduleVersion = sanitizedVersion(key);
    const srcPath = path.join(nodeModulesPath, key);
    const destPath = path.join(distPath, key, moduleVersion);

    if (await fs.stat(srcPath)) {
      await fs.cp(srcPath, destPath, { recursive: true });
    }
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
    const pathToFiles = path.resolve(__dirname, "node_modules", key);
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
  .catch(() => {
    process.exit(1);
  });
