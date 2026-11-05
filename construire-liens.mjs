#!/usr/bin/env node
/**
 * construire-liens.mjs — le lien de chaque client et la publication du module.
 *
 * Le lien collé dans l'éditeur Wix est https://cdn.jsdelivr.net/gh/WapitixAgency/wapia-avis@main/c/<clé>.js : un CHARGEUR
 * de quelques lignes qui ne change jamais. Il lit version.json chez GitHub (à jour en moins de 5 minutes), puis charge le module
 * à une adresse figée sur cette version (jsDelivr @<commit>, qui ne peut pas servir une ancienne copie). Pourquoi : jsDelivr a
 * servi pendant des heures une ancienne version d'un fichier en @main, même après purge (mesuré le 05/11, bouton absent sur
 * Laugerie). Les vitrines, elles, se lisent aussi chez GitHub (widget-avis.js, DONNEES).
 *
 *   node construire-liens.mjs             → (ré)écrit c/<clé>.js pour chaque vitrine de donnees/ (nouveau client)
 *   node construire-liens.mjs --publier   → après une modification de widget-avis.js : commit, push, version.json pointé sur ce
 *                                           commit, push, puis vérifie que GitHub et jsDelivr servent bien la nouvelle version
 */
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ICI = dirname(fileURLToPath(import.meta.url));
const git = (...a) => execFileSync('git', ['-C', ICI, ...a], { encoding: 'utf8' }).trim();
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

const chargeur = (cle) => `/*! Wapia — module d'avis, lien de ${cle}. Ce fichier ne change jamais : il charge la version publiée du module. */
(() => {
  if (customElements.get('wapia-avis')) return;
  const charger = (src) => { const s = document.createElement('script'); s.src = src; s.async = true; s.dataset.client = ${JSON.stringify(cle)}; document.head.appendChild(s); };
  fetch('https://raw.githubusercontent.com/WapitixAgency/wapia-avis/main/version.json', { cache: 'no-cache', credentials: 'omit' })
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((v) => { if (!/^[0-9a-f]{7,40}$/.test(v.commit)) throw new Error('version'); charger('https://cdn.jsdelivr.net/gh/WapitixAgency/wapia-avis@' + v.commit + '/widget-avis.js'); })
    .catch(() => charger('https://cdn.jsdelivr.net/gh/WapitixAgency/wapia-avis@main/widget-avis.js'));
})();
`;

const cles = fs.readdirSync(join(ICI, 'donnees')).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).filter((c) => /^[a-z0-9-]+$/.test(c));
fs.mkdirSync(join(ICI, 'c'), { recursive: true });
for (const c of cles) fs.writeFileSync(join(ICI, 'c', `${c}.js`), chargeur(c));
console.log(`${cles.length} liens : ${cles.join(', ')}`);

if (process.argv.includes('--publier')) {
  git('add', 'widget-avis.js', 'c', 'construire-liens.mjs');
  if (git('diff', '--cached', '--name-only')) git('commit', '-q', '-m', "Module d'avis : nouvelle version");
  git('push', '-q');
  const commit = git('rev-parse', 'HEAD');
  fs.writeFileSync(join(ICI, 'version.json'), JSON.stringify({ commit, le: new Date().toISOString() }, null, 1) + '\n');
  git('add', 'version.json'); git('commit', '-q', '-m', "Module d'avis : version publiée"); git('push', '-q');
  console.log(`version publiée : ${commit}`);
  // Vérification, au plus 6 essais à une minute d'écart : version.json chez GitHub, et le module figé chez jsDelivr.
  const local = fs.readFileSync(join(ICI, 'widget-avis.js'), 'utf8').replace(/\r/g, '');
  for (let essai = 1; essai <= 6; essai++) {
    await attendre(essai === 1 ? 20000 : 60000);
    let v = null, m = '';
    try { v = await (await fetch('https://raw.githubusercontent.com/WapitixAgency/wapia-avis/main/version.json', { cache: 'no-store' })).json(); } catch {}
    try { m = (await (await fetch(`https://cdn.jsdelivr.net/gh/WapitixAgency/wapia-avis@${commit}/widget-avis.js`)).text()).replace(/\r/g, ''); } catch {}
    const ok = v && v.commit === commit && m === local;
    console.log(`essai ${essai} : version.json ${v && v.commit === commit ? 'à jour' : 'ancien'}, module ${m === local ? 'servi' : 'pas encore servi'}`);
    if (ok) { console.log('publication vérifiée : les liens chargent cette version'); process.exit(0); }
  }
  console.log('ATTENTION : la nouvelle version n’est pas encore servie partout ; relancer la vérification plus tard'); process.exitCode = 1;
}
