const esBuild = require("esbuild");

async function generateJS() {
  await esBuild.build({
    entryPoints: ["./main.js"],
    bundle: true,
    minify: true,
    sourcemap: true,
    outfile: "./dist/ladon-globals.js",
    platform: "browser",
    target: ["es2015"],
  });
}

try {
  generateJS();
} catch (e) {
  process.exit(1);
}
