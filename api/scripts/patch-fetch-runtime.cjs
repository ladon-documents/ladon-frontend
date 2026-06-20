const fs = require("fs");
const paths = ["fetch-client/runtime.ts", "plugin-fetch-client/runtime.ts"];

const target = "constructor(public cause: Error, msg?: string) {";
const replacement = "constructor(public override cause: Error, msg?: string) {";

for (const path of paths) {
  if (fs.existsSync(path) === false) {
    console.error("runtime.ts not found at " + path);
    process.exit(1);
  }

  const source = fs.readFileSync(path, "utf8");

  if (source.includes(replacement)) {
    console.log(`patch-fetch-runtime: ${path} already patched`);
    continue;
  }

  if (source.includes(target) === false) {
    console.error(
      `patch-fetch-runtime: expected constructor signature not found in ${path}`,
    );
    process.exit(1);
  }

  const updated = source.replace(target, replacement);
  fs.writeFileSync(path, updated);
  console.log(`patch-fetch-runtime: patched ${path}`);
}
