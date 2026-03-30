const fs = require('fs');
const path = 'fetch-client/runtime.ts';

if (fs.existsSync(path) === false) {
  console.error('runtime.ts not found at ' + path);
  process.exit(1);
}

const source = fs.readFileSync(path, 'utf8');
const target = 'constructor(public cause: Error, msg?: string) {';
const replacement = 'constructor(public override cause: Error, msg?: string) {';

if (source.includes(replacement)) {
  console.log('patch-fetch-runtime: already patched');
  process.exit(0);
}

if (source.includes(target) === false) {
  console.error('patch-fetch-runtime: expected constructor signature not found');
  process.exit(1);
}

const updated = source.replace(target, replacement);
fs.writeFileSync(path, updated);
console.log('patch-fetch-runtime: patched runtime.ts');
