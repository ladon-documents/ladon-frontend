const fs = require("fs");
const path = require("path");

const distPath = path.resolve(__dirname, "dist");
const polyfillsPath = path.resolve(distPath, "polyfills.js");
const mainPath = path.resolve(distPath, "main.js");

const entryFiles = [polyfillsPath, mainPath].filter((filePath) => fs.existsSync(filePath));

if (!entryFiles.includes(mainPath)) {
    throw new Error(`Missing build artifact: ${mainPath}`);
}

module.exports = {
    entry: {
        "wc-ladon-pdfviewer.js": entryFiles,
    },
    output: { filename: "[name]", path: distPath },
};
