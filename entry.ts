import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import fg from 'fast-glob';

const sourceDir = path.join(__dirname, 'src');
const pkgJsonDir = path.join(__dirname, 'package.json');

(async function addSourceToPackageJson() {
  const entryPaths = await fg(`${sourceDir}/**/*.{html,png,jpg,jpeg}`);
  const relativePaths = entryPaths.map((absPath) => `.${absPath.replace(process.cwd(), '')}`);

  const pkgRaw = await readFile(pkgJsonDir, 'utf-8');
  const pkgJson = JSON.parse(pkgRaw);
  pkgJson.source = relativePaths;

  await writeFile(pkgJsonDir, JSON.stringify(pkgJson, null, 2), 'utf-8');
})();
