import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const wcRoot = path.join(repoRoot, 'wc');
const targetDir = path.join(repoRoot, 'ui', 'public', 'dev-wc');
const manifestPath = path.join(targetDir, 'manifest.json');
const bundlePattern = /^wc-.*\.js$/;

async function getDirectories(rootDir) {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
}

async function collectConfiguredBundles() {
  const projects = await getDirectories(wcRoot);
  const bundles = [];

  for (const project of projects) {
    const projectDir = path.join(wcRoot, project);
    const webpackConfigPath = path.join(projectDir, 'webpack.config.cjs');
    const distDir = path.join(projectDir, 'dist');

    let webpackConfig;
    try {
      webpackConfig = await fs.readFile(webpackConfigPath, 'utf8');
    } catch {
      continue;
    }

    const configuredBundleNames = [...webpackConfig.matchAll(/['"](wc-[^'"]+\.js)['"]/g)].map((match) => match[1]);

    for (const bundleName of configuredBundleNames) {
      const sourcePath = path.join(distDir, bundleName);
      try {
        const stats = await fs.stat(sourcePath);
        if (stats.isFile()) {
          bundles.push({
            project,
            bundleName,
            sourcePath,
          });
        }
      } catch {
        // Bundle has not been built yet.
      }
    }
  }

  return bundles;
}

async function cleanupStaleBundles(validBundleNames) {
  let existing;
  try {
    existing = await fs.readdir(targetDir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of existing) {
    if (!entry.isFile()) {
      continue;
    }

    if (!bundlePattern.test(entry.name)) {
      continue;
    }

    if (!validBundleNames.has(entry.name)) {
      await fs.unlink(path.join(targetDir, entry.name));
    }
  }
}

async function syncBundles() {
  await fs.mkdir(targetDir, { recursive: true });

  const bundles = await collectConfiguredBundles();
  const uniqueByName = new Map();

  for (const bundle of bundles) {
    uniqueByName.set(bundle.bundleName, bundle);
  }

  const selectedBundles = [...uniqueByName.values()].sort((a, b) => a.bundleName.localeCompare(b.bundleName));
  const validNames = new Set(selectedBundles.map((bundle) => bundle.bundleName));

  await cleanupStaleBundles(validNames);

  for (const bundle of selectedBundles) {
    const targetPath = path.join(targetDir, bundle.bundleName);
    await fs.copyFile(bundle.sourcePath, targetPath);
  }

  const manifest = selectedBundles.map((bundle) => bundle.bundleName);
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log(`Synced ${manifest.length} webcomponent bundle(s) to ${path.relative(repoRoot, targetDir)}`);
  for (const bundle of selectedBundles) {
    console.log(`- ${bundle.bundleName} (${bundle.project})`);
  }
}

syncBundles().catch((error) => {
  console.error('Failed to sync local webcomponents', error);
  process.exitCode = 1;
});
