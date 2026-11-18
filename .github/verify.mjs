// Vérifie qu'une app d'une seule page tient encore debout.
//   node verify.mjs [racine]
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname, resolve } from 'node:path';
import { createServer } from 'node:http';
import { chromium } from 'playwright';

const root = process.argv[2] || '.';
const ignored = new Set(['.git', 'node_modules', '.github']);
const problemes = [];

function fichiers(dir) {
  return readdirSync(dir).flatMap(nom => {
    if (ignored.has(nom)) return [];
    const p = join(dir, nom);
    return statSync(p).isDirectory() ? fichiers(p) : [p];
  });
}

// --- 1. syntaxe ---
let verifies = 0;
for (const f of fichiers(root)) {
  const ext = extname(f), nom = relative(root, f);
  if (ext === '.json') {
    try { JSON.parse(readFileSync(f, 'utf8')); verifies++; }
    catch (e) { problemes.push(`${nom} : JSON invalide, ${e.message}`); }
  } else if (ext === '.js' || ext === '.mjs') {
    const src = readFileSync(f, 'utf8');
    let ok = false, premiere = null;
    for (const type of ['module', 'commonjs']) {
      const r = await import('node:child_process').then(cp =>
        cp.spawnSync(process.execPath, ['--check', '--input-type=' + type, '-'],
          { input: src, encoding: 'utf8' }));
      if (r.status === 0) { ok = true; break; }
      if (!premiere) premiere = (r.stderr || '').split('\n').filter(Boolean).slice(-3).join(' ');
    }
    if (ok) verifies++; else problemes.push(`${nom} : JavaScript invalide, ${premiere}`);
  }
}
console.log(`Syntaxe : ${verifies} fichier(s) lu(s) sans erreur.`);

// --- 1 bis. version embarquée contre version.json ---
try {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  const m = html.match(/APP_VERSION\s*=\s*["']([^"']+)["']/);
  const vj = JSON.parse(readFileSync(join(root, 'version.json'), 'utf8'));
  const declaree = vj.v ?? vj.version;
  if (m && declaree != null) {
    if (m[1] !== declaree) problemes.push(`version.json annonce ${declaree} mais index.html embarque ${m[1]}`);
    else console.log(`Version : index.html et version.json annoncent tous deux ${declaree}.`);
  }
} catch { /* pas ce mécanisme ici */ }

// --- 2 et 3. la page se charge ---
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };

const racine = resolve(root);
const serveur = createServer((req, res) => {
  const chemin = decodeURIComponent(req.url.split('?')[0]);
  const f = resolve(racine, '.' + (chemin === '/' ? '/index.html' : chemin));
  try {
    if (relative(racine, f).startsWith('..')) throw new Error('hors racine');
    const corps = readFileSync(f);
    res.writeHead(200, { 'Content-Type': types[extname(f)] || 'application/octet-stream' });
    res.end(corps);
  } catch { res.writeHead(404).end('absent'); }
});
await new Promise(r => serveur.listen(0, r));
const base = `http://127.0.0.1:${serveur.address().port}`;

const navigateur = await chromium.launch();
const page = await (await navigateur.newContext({ viewport: { width: 390, height: 844 } })).newPage();
const exceptions = [], manquants = [], distants = [];
page.on('pageerror', e => exceptions.push(String(e)));
page.on('response', r => {
  if (r.status() < 400) return;
  (r.url().startsWith(base) ? manquants : distants).push(`${r.status()} ${r.url()}`);
});
page.on('requestfailed', r => { if (r.url().startsWith(base)) manquants.push(`échec ${r.url()}`); });

await page.goto(base + '/index.html', { waitUntil: 'load' });
await page.waitForTimeout(2500);
const texte = (await page.evaluate(() => document.body.innerText || '')).trim();
await navigateur.close();
serveur.close();

exceptions.forEach(e => problemes.push(`exception JavaScript au chargement : ${e}`));
[...new Set(manquants)].forEach(m => problemes.push(`fichier du dépôt introuvable : ${m}`));
if (texte.length < 20) problemes.push(`la page est vide une fois chargée (${texte.length} caractères)`);

console.log(`Chargement : ${texte.length} caractères affichés, ${exceptions.length} exception(s).`);
if (distants.length) console.log(`Appels externes en échec, ignorés : ${[...new Set(distants)].length}.`);

if (problemes.length) {
  console.error('\nVérification en échec :');
  problemes.forEach(p => console.error('  - ' + p));
  process.exit(1);
}
console.log('\nTout est en ordre.');
