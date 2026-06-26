const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pkgPath = path.join(__dirname, '..', 'package.json');
const verPath = path.join(__dirname, '..', 'src', 'lib', 'version.ts');

try {
  // 1. Read package.json
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const oldVersion = pkg.version; // e.g. "1.0.0"

  const parts = oldVersion.split('.');
  if (parts.length !== 3) {
    throw new Error(`Invalid version format: ${oldVersion}`);
  }

  // Parse digits
  let m = parseInt(parts[0], 10);
  let n = parseInt(parts[1], 10);
  let p = parseInt(parts[2], 10);

  // 2. Increment patch digit p
  p += 1;
  if (p > 9) {
    p = 0;
    n += 1;
    if (n > 9) {
      n = 0;
      m += 1;
    }
  }

  const newVersion = `${m}.${n}.${p}`;
  console.log(`Bumping application version: ${oldVersion} -> ${newVersion}`);

  // 3. Write back to package.json
  pkg.version = newVersion;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

  // 4. Update src/lib/version.ts
  const tsContent = `export const VERSION = '${newVersion}';\n`;
  fs.writeFileSync(verPath, tsContent);

  // 5. Stage modified version files in Git (for pre-commit hooks)
  try {
    execSync(`git add "${pkgPath}" "${verPath}"`, { stdio: 'ignore' });
  } catch (err) {
    // Git might not be initialized or files not tracked, ignore in non-git environments
  }

} catch (error) {
  console.error('Error running version bump script:', error);
  process.exit(1);
}
