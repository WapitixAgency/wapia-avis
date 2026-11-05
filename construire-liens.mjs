#!/usr/bin/env node
/**
 * construire-liens.mjs — fabrique c/<cle>.js pour chaque vitrine de donnees/ : le widget, avec la clé du client écrite dedans.
 * Dans l'éditeur Wix, on colle alors https://cdn.jsdelivr.net/gh/WapitixAgency/wapia-avis@main/c/<cle>.js, sans aucun attribut :
 * les réglages d'affichage du site sont dans la vitrine (sites.json de la routine, puis CMS du client).
 *
 *   node construire-liens.mjs            → réécrit c/*.js
 *   node construire-liens.mjs --purger   → et vide le cache jsDelivr de chaque lien (après le push)
 *
 * À relancer à chaque modification de widget-avis.js, et quand un client est ajouté.
 */
import fs from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ICI = dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(join(ICI, 'widget-avis.js'), 'utf8');
if (!source.includes('const CLIENT_DU_LIEN = null;')) throw new Error('widget-avis.js : marqueur CLIENT_DU_LIEN introuvable');
const cles = fs.readdirSync(join(ICI, 'donnees')).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).filter((c) => /^[a-z0-9-]+$/.test(c));
fs.mkdirSync(join(ICI, 'c'), { recursive: true });
for (const c of cles) fs.writeFileSync(join(ICI, 'c', `${c}.js`), source.replace('const CLIENT_DU_LIEN = null;', `const CLIENT_DU_LIEN = ${JSON.stringify(c)};`));
console.log(`${cles.length} liens : ${cles.join(', ')}`);
if (process.argv.includes('--purger')) {
  const chemins = ['widget-avis.js', ...cles.map((c) => `c/${c}.js`)];
  for (const p of chemins) { try { await fetch(`https://purge.jsdelivr.net/gh/WapitixAgency/wapia-avis@main/${p}`); } catch {} }
  console.log(`cache jsDelivr vidé : ${chemins.length} fichiers`);
}
