import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const excludedDirectories = new Set(['node_modules', '.git', '.gradle', 'build', 'dist', 'test-results', 'playwright-report', '.idea', 'DerivedData', 'Pods', 'capacitor-cordova-android-plugins', 'capacitor-cordova-ios-plugins']);
const excludedPaths = new Set([
  'android/local.properties', 'android/app/src/main/assets/public',
  'android/app/src/main/assets/capacitor.config.json', 'android/app/src/main/assets/capacitor.plugins.json',
  'android/app/src/main/res/xml/config.xml', 'ios/App/App/public',
  'ios/App/App/capacitor.config.json', 'ios/App/App/config.xml',
]);
const files = [];
async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    const relative = path.relative(root, absolute).split(path.sep).join('/');
    if (excludedPaths.has(relative) || entry.name.endsWith('.tsbuildinfo')) continue;
    if (entry.isDirectory()) {
      if (!excludedDirectories.has(entry.name)) await visit(absolute);
    } else if (!/\.(apk|aab|log)$/.test(entry.name)) files.push(relative);
  }
}
await mkdir('docs', { recursive: true });
await writeFile('docs/FILES.md', '');
await visit(root);
files.sort();
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
const text = `# Inventario della consegna\n\n${files.length} file di sorgenti, configurazioni, documentazione e asset nativi (incluso questo inventario). Tutti creati in questa attività: la directory iniziale era vuota.\n\nEsclusi dipendenze, build/cache, APK/AAB, risultati test, file locali e copie Web generate da cap sync. Rigenerare con \`node scripts/inventory.mjs\`. I progetti nativi comprendono anche gli asset e i wrapper ufficiali generati da Capacitor.\n\nDipendenze dirette: ${Object.keys(pkg.dependencies).length} runtime + ${Object.keys(pkg.devDependencies).length} sviluppo = ${Object.keys(pkg.dependencies).length + Object.keys(pkg.devDependencies).length}.\n\n${files.map((file) => '- `' + file + '`').join('\n')}\n`;
await writeFile('docs/FILES.md', text);
console.log(`${files.length} file; ${Object.keys(pkg.dependencies).length} runtime + ${Object.keys(pkg.devDependencies).length} development dependencies.`);
