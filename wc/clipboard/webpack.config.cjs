const path = require("path");
module.exports = {
    entry: {
        "wc-ladon-clipboard.js": [
            path.resolve(__dirname, "dist/polyfills.js"),
            path.resolve(__dirname, "dist/main.js"),
        ],
    },
    output: { filename: "[name]", path: path.resolve(__dirname, "dist") },
};
