const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const ignored = new Set(['node_modules', 'android', 'ios', 'dist', 'artifacts', '.test-build', '.git', '.expo']);
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (ignored.has(entry.name)) return [];
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(absolute);
    return [path.relative(root, absolute).split(path.sep).join('/')];
  });
}
const files = [...new Set([...walk(root), 'docs/FILES.md'])].sort();
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const runtime = Object.keys(manifest.dependencies).length;
const development = Object.keys(manifest.devDependencies).length;
const text = `# Inventario della consegna\n\n${files.length} file nel progetto sorgente, inclusi configurazioni, lockfile, asset del template, documentazione, test e immagini di verifica. Il repository era vuoto: sono tutti file creati in questa sessione.\n\nEsclusi: ${[...ignored].map((name) => '`' + name + '/`').join(', ')}. I progetti nativi e i bundle sono output generati, non inclusi nel conteggio comparativo.\n\nDipendenze dirette: **${runtime} runtime + ${development} sviluppo = ${runtime + development}**; rispetto al template, **${runtime - 4} runtime e ${development - 2} sviluppo aggiunte**.\n\nRigenerare l’inventario con \`node scripts/inventory.cjs\`.\n\n`;
fs.writeFileSync(path.join(root, 'docs/FILES.md'), text + files.map((file) =>
  `- [${file}](${path.posix.relative('docs', file)})`).join('\n') + '\n');
console.log(`${files.length} file; ${runtime} dipendenze runtime; ${development} dipendenze sviluppo`);
