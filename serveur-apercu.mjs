// Petit serveur local pour l'aperçu du module d'avis (node serveur-apercu.mjs [port]). Lecture seule, dossier courant du script.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RACINE = dirname(fileURLToPath(import.meta.url));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };
const port = Number(process.argv[2]) || 4390;
http.createServer(async (req, res) => {
  const chemin = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
  const fichier = join(RACINE, chemin || 'apercu.html');
  if (!fichier.startsWith(RACINE)) { res.writeHead(403).end(); return; }
  try { const c = await readFile(fichier); res.writeHead(200, { 'content-type': TYPES[extname(fichier)] || 'application/octet-stream', 'cache-control': 'no-store' }).end(c); }
  catch { res.writeHead(404).end('introuvable'); }
}).listen(port, '127.0.0.1', () => console.log(`aperçu : http://127.0.0.1:${port}/apercu.html`));
