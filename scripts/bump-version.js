const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '../package.json');
const versionTsPath = path.join(__dirname, '../src/lib/version.ts');

const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

let [m, n, p] = pkg.version.split('.').map(Number);

p++;
if (p > 9) {
  p = 0;
  n++;
  if (n > 9) {
    n = 0;
    m++;
  }
}

const newVersion = `${m}.${n}.${p}`;

pkg.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
fs.writeFileSync(versionTsPath, `export const VERSION = '${newVersion}';\n`);

console.log(newVersion);
