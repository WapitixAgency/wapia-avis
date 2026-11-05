/*!
 * Wapia — module d'avis (custom element <wapia-avis>), sans cookie, sans requête vers Google.
 *
 *   <wapia-avis client="gambas-royale"></wapia-avis>
 *   <wapia-avis client="domaine-laugerie" accent="#1f6f5c" fond-carte="blanc" bouton style-bouton="plein"></wapia-avis>
 *
 * Attributs (tous facultatifs sauf client ; un attribut posé l'emporte sur les réglages du CMS) :
 *   client        clé de la vitrine (obligatoire)
 *   modele        carrousel (défaut) | grille | bandeau
 *   theme         clair (défaut) | sombre
 *   accent        couleur du site (#RRGGBB) : bouton, liens, flèches, points
 *   fond          fond du module entier (défaut : transparent, il prend celui de la section)
 *   fond-carte    fond des cartes : blanc (défaut), une couleur, ou transparent
 *   ombre         non : cartes sans ombre (utile quand la carte a la couleur de la section)
 *   bouton        présent = affiche « Laisser un avis » ; bouton="Votre texte" change le libellé
 *   style-bouton  contour (défaut) | plein
 *   police        police du module (ex. police="poppins" ou une pile CSS) ; sinon celle de la page
 *   entete        non : masque la note globale
 *   nombre        nombre de cartes ; titre : titre au-dessus ; source : filtre initial (google, booking…)
 *   reponses      présent = affiche les réponses du gérant ; donnees : adresse d'un JSON (essais)
 * Les avis viennent de donnees/<client>.json, à côté de ce script ; la vitrine est choisie par l'agent Wapia.
 * Jamais le mot « vérifié » : les avis Google ne le sont pas.
 */
(() => {
  if (customElements.get('wapia-avis')) return;
  // Lien propre à un client (c/<cle>.js, fabriqué par construire-liens.mjs) : la clé y est écrite, l'attribut client devient facultatif.
  const CLIENT_DU_LIEN = null;
  const ICI = document.currentScript;
  const CLIENT_DU_CHARGEUR = ICI && ICI.dataset && ICI.dataset.client; // posé par le chargeur c/<clé>.js
  const SCRIPT = ICI && ICI.src;
  const LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1)[:/]/.test(SCRIPT || '');
  const BASE = SCRIPT && LOCAL ? SCRIPT.replace(/(c\/)?[^/]*$/, '') : 'https://cdn.jsdelivr.net/gh/WapitixAgency/wapia-avis@main/';
  // Les vitrines se lisent chez GitHub (à jour moins de 5 minutes après chaque passage de la routine) : jsDelivr garde
  // parfois une ancienne copie des heures, même après purge (mesuré le 05/11 sur Laugerie). jsDelivr ne sert plus que de repli.
  const DONNEES = LOCAL ? BASE + 'donnees/' : 'https://raw.githubusercontent.com/WapitixAgency/wapia-avis/main/donnees/';
  const REPLI = 'https://cdn.jsdelivr.net/gh/WapitixAgency/wapia-avis@main/donnees/';
  const cache = new Map();

  const SOURCES = {
    google: { nom: 'Google', mot: 'Avis Google', svg: '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>' },
    booking: { nom: 'Booking.com', mot: 'Avis Booking.com', svg: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="8" fill="#003580"/><text x="11" y="34" font-family="Arial,sans-serif" font-weight="700" font-size="26" fill="#fff">B.</text></svg>' },
    airbnb: { nom: 'Airbnb', mot: 'Avis Airbnb', svg: '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FF5A5F" d="M24 4c-2.6 0-4.4 1.6-5.8 4.4C14.6 15.6 9 27.4 7.6 31c-1.9 5 1.6 9.9 6.7 9.9 3.5 0 6.6-2.2 9.7-5.7 3.1 3.5 6.2 5.7 9.7 5.7 5.1 0 8.6-4.9 6.7-9.9-1.4-3.6-7-15.4-10.6-22.6C28.4 5.6 26.6 4 24 4zm0 27.6c-2.3-2.9-3.8-5.6-3.8-7.6 0-2.3 1.6-3.8 3.8-3.8s3.8 1.5 3.8 3.8c0 2-1.5 4.7-3.8 7.6z"/></svg>' },
  };
  const src = (id) => SOURCES[id] || { nom: id, mot: 'Avis', svg: '' };
  const CHEVRON = (sens) => `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="${sens === 'g' ? 'M15 5l-7 7 7 7' : sens === 'b' ? 'M5 9l7 7 7-7' : 'M9 5l7 7-7 7'}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  const echap = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sur = (u) => (/^https:\/\//i.test(String(u || '')) ? echap(u) : '#');
  const etoiles = (n, taille = 16) => {
    let h = `<span class="et" role="img" aria-label="${n} sur 5">`;
    for (let i = 1; i <= 5; i++) {
      const plein = Math.max(0, Math.min(1, n - i + 1));
      h += `<svg viewBox="0 0 24 24" width="${taille}" height="${taille}" aria-hidden="true"><defs><linearGradient id="g${i}${Math.round(plein * 10)}"><stop offset="${plein * 100}%" stop-color="var(--etoile)"/><stop offset="${plein * 100}%" stop-color="var(--etoile-vide)"/></linearGradient></defs><path fill="url(#g${i}${Math.round(plein * 10)})" d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"/></svg>`;
    }
    return h + '</span>';
  };
  const teinte = (nom) => { let h = 0; for (const c of String(nom)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
  const auteurAffiche = (nom) => { const m = String(nom || '').trim().split(/\s+/).filter((x) => /^\p{L}/u.test(x)); if (!m.length) return ''; const cap = (s) => s.charAt(0).toLocaleUpperCase('fr') + s.slice(1); const p = m[0].split('-').map(cap).join('-'); return m.length > 1 ? p + ' ' + m[m.length - 1].charAt(0).toLocaleUpperCase('fr') + '.' : p; };
  const noteTexte = (n) => (n == null || n === '' ? '' : Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
  const nettoyerReponse = (s) => String(s || '').replace(/^R[ée]ponse du propri[ée]taire\s*(il y a \S+ \S+)?\s*/i, '');
  const nettoyerTexte = (s) => String(s || '').replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  const initiale = (nom) => (String(nom).match(/\p{L}/u) || ['?'])[0].toUpperCase();
  const quand = (iso) => {
    if (!iso) return '';
    const d = new Date(iso); if (isNaN(d)) return String(iso);
    const jours = Math.round((Date.now() - d) / 864e5);
    const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });
    if (jours < 1) return "aujourd'hui";
    if (jours < 30) return rtf.format(-jours, 'day');
    if (jours < 365) return rtf.format(-Math.round(jours / 30.4), 'month');
    return rtf.format(-Math.round(jours / 365), 'year');
  };
  const note10 = (s, n) => (s === 'booking' ? `<span class="n10">${echap(Math.round(n * 2 * 10) / 10)}</span>` : '');
  // Couleur acceptée d'un attribut : blanc, transparent, #hex, rgb()/hsl(). Le reste est ignoré.
  const couleur = (v) => {
    const s = String(v ?? '').trim().toLowerCase();
    if (!s) return null;
    if (s === 'blanc') return '#fff';
    if (s === 'noir') return '#000';
    if (s === 'transparent' || s === 'aucun') return 'transparent';
    if (/^#[0-9a-f]{3,8}$/.test(s) || /^(rgb|hsl)a?\([\d\s.,%/]+\)$/.test(s)) return s;
    return null;
  };
  // Texte lisible sur l'accent : encre sombre si l'accent est clair, blanc sinon.
  const lum = (hex) => {
    const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex || ''); if (!m) return null;
    const h = m[1].length === 3 ? m[1].replace(/./g, '$&$&') : m[1];
    const [r, g, b] = [0, 2, 4].map((i) => { const c = parseInt(h.slice(i, i + 2), 16) / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const surAccent = (hex) => (lum(hex) > 0.42 ? '#1d1d1b' : '#fff');
  const police = (v) => {
    const s = String(v || '').trim(); if (!s || /[;{}<>]/.test(s)) return null;
    // Toujours une famille générique en dernier : sans elle, une police absente retombe sur un serif.
    const pile = s.includes(',') ? s : `"${s.replace(/"/g, '')}"`;
    return /(sans-serif|serif|monospace|system-ui|cursive)\s*$/i.test(pile) ? pile : `${pile}, sans-serif`;
  };

  // Logotype « Google » (en-tête « Google Avis », comme les anciens widgets) ; une couleur unique possible (couleur-logo).
  const MOT_GOOGLE = '<svg class="mot-g" viewBox="0 0 272 92" aria-label="Google" role="img"><path fill="#EA4335" d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/><path fill="#FBBC05" d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.980-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/><path fill="#4285F4" d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.870 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z"/><path fill="#34A853" d="M225 3v65h-9.5V3h9.5z"/><path fill="#EA4335" d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.010 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z"/><path fill="#4285F4" d="M35.29 41.41V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.030 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49.01z"/></svg>';
  // Police chargée chez Bunny Fonts (miroir de Google Fonts sans traceur), une fois par page : l'en-tête du document la rend
  // visible dans le shadow DOM. Sert à retrouver la police de l'ancien widget quand le site ne l'a pas.
  const chargerPolice = (nom) => {
    if (!/^[A-Za-z0-9 ]{2,40}$/.test(nom || '')) return false;
    const id = 'wapia-police-' + nom.toLowerCase().replace(/ /g, '-');
    if (!document.getElementById(id)) { const l = document.createElement('link'); l.id = id; l.rel = 'stylesheet'; l.href = `https://fonts.bunny.net/css?family=${nom.toLowerCase().replace(/ /g, '-')}:400,500,600,700&display=swap`; document.head.appendChild(l); }
    return true;
  };

  const CSS = `
  :host{display:block;width:100%;container-type:inline-size;font-family:inherit;color:var(--texte);background:var(--fond-module);--accent:#1a73e8;--sur-accent:#fff;--fond-module:transparent;--carte:#fff;--texte:#1d1d1b;--doux:#6b6b66;--trait:#e6e5e0;--bord:#ecebe6;--etoile:#f5b301;--etoile-vide:#d9d7d0;--rayon:16px;--col:3;--fond-entete:transparent;--ombre:0 1px 2px rgba(20,20,15,.04),0 8px 24px rgba(20,20,15,.07)}
  :host([theme=sombre]),:host([data-theme=sombre]){--carte:#1c1c1c;--texte:#f3f2ee;--doux:#a9a8a2;--trait:#3a3a37;--bord:#2a2a28;--etoile-vide:#4a4a46;--ombre:none}
  :host([data-ombre=non]){--ombre:none}
  *{box-sizing:border-box}
  /* De l'air sur les bords : l'élément Wix coupe ce qui dépasse, ombres des cartes et des flèches comprises. */
  .w{display:flex;flex-direction:column;gap:22px;padding:14px 16px 22px}
  /* En-tête compact (« Google Avis » puis « 4,9 ★★★★★ (139) ») et en-tête sans note (« Google Avis », « 1 413 avis »). */
  .cpt{display:flex;align-items:center;gap:14px;color:var(--texte-entete,var(--texte))}
  .cpt.pile{flex-direction:column;align-items:flex-start;gap:6px}
  :host([data-align=centre]) .cpt,:host([data-align=centre]) .cpt.pile{align-items:center;text-align:center}
  .cpt.haut{flex-direction:column;gap:10px}
  .cpt .logo{width:42px;height:42px}
  .cpt-t{display:flex;flex-direction:column;gap:4px}
  :host([data-align=centre]) .cpt-t{align-items:center}
  .cpt-titre{font-size:clamp(18px,2.2vw,22px);font-weight:700;line-height:1.2}
  .cpt-note{gap:8px}.cpt-chiffre{font-size:20px;font-weight:700}
  .cpt-total{font-size:13px;color:var(--doux)}
  .mot{display:inline-flex;align-items:flex-end;gap:8px;line-height:1}
  .mot-g{height:28px;width:auto}
  .mot b{font-size:21px;font-weight:600;color:var(--texte-entete,var(--texte));position:relative;top:-2px}
  :host([data-logo-mono]) .mot-g path{fill:var(--couleur-logo)}
  /* Pied « Publié sur Google » et carte centrée (étoiles, texte, puis l'auteur), comme certains anciens widgets. */
  .pied-src{display:flex;align-items:center;gap:10px;margin-top:4px;font-size:12.5px;line-height:1.25;color:var(--doux)}
  .pied-src svg{width:28px;height:28px;flex:none}.pied-src b{display:block;color:#1a73e8;font-weight:500;font-size:14px}
  :host([data-pied]) .qui .src{display:none}
  .carte.centre{align-items:center;text-align:center}
  .carte.centre .plus{align-self:center}
  .carte.centre .qui{flex-direction:column;gap:8px;margin-top:6px}
  .carte.centre .qui .src{display:none}
  .tete{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
  .score{display:flex;align-items:center;gap:14px}
  :host([data-bloc]) .tete{background:var(--fond-entete);border-radius:var(--rayon);padding:22px 26px}
  /* En-tête en pastille : la note posée dans un bloc de la couleur des cartes, lisible sur une photo ou une vidéo de fond. */
  :host([data-pastille]) .score,:host([data-pastille]) .cpt{background:var(--fond-pastille,var(--carte));border:1px solid var(--bord);border-radius:var(--rayon);box-shadow:var(--ombre);padding:14px 24px 14px 16px;color:var(--texte-entete,var(--texte))}
  :host([data-pastille]) .score .total{margin-top:6px}
  :host([data-align=centre]) .tete{flex-direction:column;justify-content:center;text-align:center}
  :host([data-align=centre]) .score{flex-direction:column;gap:10px}
  :host([data-align=centre]) .score .ligne{justify-content:center}
  .logo{width:34px;height:34px;flex:none}.logo svg,.src svg{width:100%;height:100%}
  .chiffre{font-size:34px;font-weight:700;line-height:1;letter-spacing:-.02em}
  .total{font-size:13.5px;color:var(--doux);margin-top:5px}
  .titre{font-size:clamp(20px,2.4vw,26px);font-weight:600;margin:0 0 4px}
  .btn{display:inline-flex;align-items:center;gap:8px;border:1.5px solid var(--accent);color:var(--lien,var(--accent));background:transparent;border-radius:var(--rayon-bouton,999px);padding:11px 20px;font:inherit;font-size:14.5px;font-weight:600;line-height:1.2;cursor:pointer;text-decoration:none;white-space:nowrap;transition:background .2s,color .2s,box-shadow .2s,transform .2s}
  .btn svg{width:18px;height:18px;flex:none}
  .btn:hover,.btn:focus-visible{background:var(--accent);color:var(--sur-accent);outline:none}
  .btn.plein{background:var(--accent);color:var(--sur-accent);box-shadow:0 4px 14px color-mix(in srgb,var(--accent) 28%,transparent)}
  .btn.plein:hover,.btn.plein:focus-visible{transform:translateY(-1px);box-shadow:0 8px 22px color-mix(in srgb,var(--accent) 34%,transparent)}
  .onglets{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;border-bottom:1px solid var(--trait)}
  .onglets button{appearance:none;border:0;background:none;font:inherit;font-size:14px;color:var(--doux);padding:10px 12px;cursor:pointer;white-space:nowrap;border-bottom:2px solid transparent;display:flex;gap:8px;align-items:center}
  .onglets button[aria-selected=true]{color:var(--texte);border-bottom-color:var(--accent);font-weight:600}
  .onglets .src{width:16px;height:16px}
  .piste{display:flex;gap:18px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;padding:6px 6px 26px;margin:-6px -6px -20px;scroll-padding:0 6px;scroll-behavior:smooth;align-items:stretch}
  .piste::-webkit-scrollbar{display:none}
  .piste .carte{flex:0 0 calc((100% - (var(--col) - 1) * 18px) / var(--col));scroll-snap-align:start}
  @container (max-width:1000px){.piste .carte{flex-basis:calc((100% - (min(var(--col), 3) - 1) * 18px) / min(var(--col), 3))}}
  @container (max-width:860px){.piste .carte{flex-basis:calc((100% - (min(var(--col), 2) - 1) * 18px) / min(var(--col), 2))}}
  @container (max-width:560px){.piste .carte{flex-basis:86%}}
  .grille{columns:var(--col) 260px;column-gap:18px}.grille .carte{break-inside:avoid;margin-bottom:18px}
  .carte{background:var(--carte);border:1px solid var(--bord);box-shadow:var(--ombre);border-radius:var(--rayon);padding:24px;display:flex;flex-direction:column;gap:12px}
  .qui{display:flex;align-items:center;gap:12px}
  .av{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:600;font-size:16px;flex:none}
  .nom{font-weight:600;font-size:15.5px;line-height:1.2}.date{font-size:12.5px;color:var(--doux);margin-top:3px}
  .src{width:18px;height:18px;margin-left:auto;flex:none}
  .ligne{display:flex;align-items:center;gap:8px}
  .n10{background:#003580;color:#fff;font-size:12px;font-weight:700;border-radius:5px 5px 5px 0;padding:2px 6px}
  .et{display:inline-flex;gap:1px;vertical-align:middle}
  .txt{font-size:15px;line-height:1.6;margin:0;white-space:pre-line;max-height:calc(1.6em * var(--lignes, 6));overflow:hidden}
  .txt.coupe{white-space:normal;-webkit-mask-image:linear-gradient(to bottom,#000 calc(100% - 2.2em),transparent);mask-image:linear-gradient(to bottom,#000 calc(100% - 2.2em),transparent)}
  .txt.ouvert{max-height:none;-webkit-mask-image:none;mask-image:none}
  .plus{appearance:none;border:0;background:none;padding:4px 0;margin-top:auto;font:inherit;font-size:14px;font-weight:600;color:var(--lien,var(--accent));cursor:pointer;align-self:flex-start;display:inline-flex;align-items:center;gap:6px;text-decoration:underline;text-decoration-color:transparent;text-underline-offset:4px;text-decoration-thickness:1.5px;transition:text-decoration-color .2s}
  .plus[hidden],.points[hidden]{display:none}
  .plus svg{width:16px;height:16px;transition:transform .25s}
  .plus[aria-expanded=true] svg{transform:rotate(180deg)}
  .plus:hover{text-decoration-color:currentColor}
  .rep{font-size:13.5px;color:var(--doux);border-left:2px solid var(--trait);padding-left:12px;margin:0}
  .pied{display:flex;align-items:center;justify-content:space-between;gap:16px}
  .points{display:flex;gap:7px;align-items:center;min-height:44px}
  .points button{appearance:none;border:0;padding:0;width:8px;height:8px;border-radius:999px;background:var(--trait);cursor:pointer;transition:width .25s,background .25s}
  .points button[aria-current=true]{width:24px;background:var(--accent)}
  .nav{display:flex;gap:10px;margin-left:auto}
  .nav button{appearance:none;width:46px;height:46px;border-radius:50%;border:1.5px solid var(--accent);background:var(--accent);color:var(--sur-accent);box-shadow:0 4px 14px color-mix(in srgb,var(--accent) 26%,transparent);cursor:pointer;display:grid;place-items:center;transition:transform .2s,box-shadow .2s}
  .nav button:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 20px color-mix(in srgb,var(--accent) 32%,transparent)}
  .nav button:disabled{background:transparent;color:var(--doux);border-color:var(--trait);box-shadow:none;cursor:default}
  .nav button:focus-visible,.onglets button:focus-visible,.plus:focus-visible,.points button:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
  /* Flèches posées sur les côtés des cartes (navigation="cote"), sans points : la flèche inutile s'efface. */
  .zone{position:relative}
  :host([data-nav=cote]) .points{display:none}
  .cote{position:absolute;top:calc(50% - 10px);transform:translateY(-50%);z-index:2;appearance:none;width:44px;height:44px;border-radius:50%;border:0;background:#fff;color:#1d1d1b;box-shadow:0 2px 10px rgba(0,0,0,.2);cursor:pointer;display:grid;place-items:center;transition:opacity .2s,box-shadow .2s}
  .cote.prec{left:-12px}.cote.suiv{right:-12px}
  .cote:disabled{opacity:0;pointer-events:none}
  .cote:hover{box-shadow:0 4px 16px rgba(0,0,0,.28)}
  .cote:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
  /* Texte coupé par des points de suspension (coupe="points") plutôt que par un fondu. */
  :host([data-coupe=points]) .txt.coupe:not(.ouvert){white-space:normal;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:var(--lignes,6);-webkit-mask-image:none;mask-image:none}
  /* Petit logo de la source sur l'avatar (icone-source="avatar") au lieu du logo à droite. */
  .av{position:relative}.av .mini{display:none}
  :host([data-icone=avatar]) .av .mini{display:grid;position:absolute;right:-5px;bottom:-5px;width:21px;height:21px;border-radius:50%;background:#fff;padding:2px}
  .av .mini svg{width:100%;height:100%}
  :host([data-icone=avatar]) .qui>.src{display:none}
  /* Points seuls, centrés, sans flèches (navigation="points"). */
  :host([data-nav=points]) .nav{display:none}
  :host([data-nav=points]) .pied{justify-content:center}
  /* Logo de la source dans un carré à la place de l'avatar (avatar="source"), date masquée (date="non"). */
  :host([data-avatar=source]) .av{background:#fff!important;border:1px solid var(--trait);border-radius:6px;padding:8px}
  :host([data-avatar=source]) .av .ini{display:none}
  .av .grand{display:none}:host([data-avatar=source]) .av .grand{display:block;width:100%;height:100%}
  :host([data-avatar=source]) .qui>.src,:host([data-avatar=source]) .av .mini{display:none}
  :host([data-date=non]) .date{display:none}
  /* En-tête sur une ligne : logo, note, étoiles (entete="ligne"). */
  .cpt.ligne1{flex-direction:row;align-items:center;gap:10px}
  .cpt.ligne1 .mot-g{height:30px}
  .cpt.ligne1 .cpt-chiffre{font-size:24px}
  .bandeau{display:inline-flex;align-items:center;gap:12px;padding:10px 16px;border-radius:999px;background:var(--carte);border:1px solid var(--bord);text-decoration:none;color:var(--texte);font-size:14px}
  .bandeau strong{font-size:18px}
  .mention{font-size:12px;color:var(--doux)}
  @media (prefers-reduced-motion:reduce){.piste{scroll-behavior:auto}.btn,.nav button,.plus svg,.points button{transition:none}}
  `;

  class WapiaAvis extends HTMLElement {
    static get observedAttributes() { return ['client', 'modele', 'theme', 'accent', 'nombre', 'source', 'donnees', 'titre', 'fond', 'fond-carte', 'ombre', 'bord', 'rayon', 'colonnes', 'fond-entete', 'alignement', 'couleur-etoiles', 'bouton', 'style-bouton', 'police', 'entete', 'reponses', 'lignes', 'disposition', 'pied', 'logo', 'titre-entete', 'couleur-logo', 'couleur-entete', 'police-web', 'forme-entete', 'navigation', 'coupe', 'icone-source', 'couleur-lien', 'avatar', 'date']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); }
    connectedCallback() { this.charger(); }
    attributeChangedCallback(nom) { if (!this.isConnected) return; if (this.d && nom !== 'client' && nom !== 'donnees') this.rendre(); else this.charger(); }
    async charger() {
      const client = this.getAttribute('client') || CLIENT_DU_LIEN || CLIENT_DU_CHARGEUR; if (!client) return;
      const url = this.getAttribute('donnees') || `${DONNEES}${encodeURIComponent(client)}.json`;
      try {
        const lire = (u) => fetch(u, { credentials: 'omit', cache: 'no-cache' }).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });
        if (!cache.has(url)) cache.set(url, lire(url).catch((e) => (url.startsWith(DONNEES) && !LOCAL ? lire(REPLI + url.slice(DONNEES.length)) : Promise.reject(e))));
        this.d = await cache.get(url);
        this.filtre = this.filtre || this.getAttribute('source') || 'tous';
        this.rendre();
      } catch { this.shadowRoot.innerHTML = ''; }
    }
    // Attribut posé > réglage du CMS (bloc « affichage » de la vitrine) > défaut.
    reglage(attr, cle) { return this.hasAttribute(attr) ? this.getAttribute(attr) : (this.d.affichage || {})[cle]; }
    habiller() {
      const st = this.style, ds = this.dataset;
      const pose = (v, val) => (val != null && val !== '' ? st.setProperty(v, val) : st.removeProperty(v));
      const drapeau = (k, oui) => (oui ? (ds[k] = oui) : delete ds[k]);
      if (!this.hasAttribute('theme')) drapeau('theme', (this.d.affichage || {}).theme === 'sombre' ? 'sombre' : '');
      const accent = couleur(this.reglage('accent', 'couleur'));
      pose('--accent', accent); pose('--sur-accent', accent ? surAccent(accent) : null);
      // Un accent clair (jaune, pêche) ne se lit pas en texte sur fond clair, ni un accent foncé sur fond sombre : le lien prend alors la couleur du texte.
      const sombre = (this.getAttribute('theme') || ds.theme) === 'sombre', clair = accent && lum(accent) > 0.3; // contraste < 3:1 sur blanc
      pose('--lien', accent && (sombre ? !clair : clair) ? 'var(--texte)' : null);
      const fc = couleur(this.reglage('fond-carte', 'fondCarte'));
      pose('--carte', fc);
      const b = String(this.reglage('bord', 'bord') || '').trim();
      pose('--bord', /^non$/i.test(b) ? 'transparent' : couleur(b) || (fc === 'transparent' ? 'var(--trait)' : null));
      drapeau('ombre', /^non$/i.test(this.reglage('ombre', 'ombre') || '') || fc === 'transparent' ? 'non' : '');
      const r = Number.parseInt(this.reglage('rayon', 'rayon'), 10);
      pose('--rayon', Number.isFinite(r) && r >= 0 && r <= 40 ? r + 'px' : null); pose('--rayon-bouton', r === 0 ? '0' : null);
      const col = Number.parseInt(this.reglage('colonnes', 'colonnes'), 10);
      pose('--col', col >= 1 && col <= 5 ? String(col) : null);
      pose('--fond-module', couleur(this.reglage('fond', 'fond')));
      const fe = couleur(this.reglage('fond-entete', 'fondEntete'));
      const pastille = /^pastille$/i.test(this.reglage('forme-entete', 'formeEntete') || '');
      drapeau('pastille', pastille ? 'oui' : '');
      pose('--fond-entete', pastille ? null : fe); drapeau('bloc', fe && !pastille ? 'oui' : '');
      pose('--fond-pastille', pastille ? fe : null);
      pose('--etoile', couleur(this.reglage('couleur-etoiles', 'couleurEtoiles')));
      drapeau('align', /^cent/i.test(this.reglage('alignement', 'alignement') || '') ? 'centre' : '');
      const pw = this.reglage('police-web', 'policeWeb');
      const pol = police(this.reglage('police', 'police')) || (chargerPolice(pw) ? police(pw) : null);
      pose('font-family', pol);
      const lg = Number.parseInt(this.reglage('lignes', 'lignes'), 10);
      pose('--lignes', lg >= 2 && lg <= 12 ? String(lg) : null);
      const cl = couleur(this.reglage('couleur-logo', 'couleurLogo'));
      pose('--couleur-logo', cl); drapeau('logoMono', cl ? 'oui' : '');
      pose('--texte-entete', couleur(this.reglage('couleur-entete', 'couleurEntete')));
      drapeau('pied', /^google$/i.test(this.reglage('pied', 'pied') || '') ? 'google' : '');
      const cli = couleur(this.reglage('couleur-lien', 'couleurLien')); if (cli) pose('--lien', cli);
      const nav = String(this.reglage('navigation', 'navigation') || '');
      drapeau('nav', /^c[oô]t/i.test(nav) ? 'cote' : /^points?$/i.test(nav) ? 'points' : '');
      drapeau('avatar', /^source$/i.test(this.reglage('avatar', 'avatar') || '') ? 'source' : '');
      drapeau('date', /^non$/i.test(String(this.reglage('date', 'date') ?? '')) ? 'non' : '');
      drapeau('coupe', /^points?$/i.test(this.reglage('coupe', 'coupe') || '') ? 'points' : '');
      drapeau('icone', /^avatar$/i.test(this.reglage('icone-source', 'iconeSource') || '') ? 'avatar' : '');
    }
    rendre() {
      const d = this.d, af = d.affichage || {}, modele = this.getAttribute('modele') || af.modele || 'carrousel';
      this.habiller();
      const sources = d.sources || [];
      // Plusieurs annonces d'une même plateforme (Booking Honfleur, Booking Saint-Malo…) : chaque source a son id, et son « type » donne le logo.
      const typeDe = (id) => (sources.find((x) => x.id === id) || {}).type || id;
      const s0 = this.filtre === 'tous' ? null : sources.find((s) => s.id === this.filtre);
      const note = s0 ? s0.note5 ?? s0.note : d.note, total = s0 ? s0.total : d.total;
      const lienAvis = (s0 || sources[0] || {}).lienAvis || d.lienAvis;
      if (modele === 'bandeau') {
        const s = sources[0] || { id: 'google' };
        this.shadowRoot.innerHTML = `<style>${CSS}</style><a class="bandeau" href="${sur(s.lien || d.lienFiche)}" target="_blank" rel="noopener"><span class="logo" style="width:22px;height:22px">${src(typeDe(s.id)).svg}</span><strong>${echap(noteTexte(d.note))}</strong>${etoiles(d.note, 16)}<span class="mention">${echap(d.total)} avis</span></a>`;
        return;
      }
      const reponses = this.hasAttribute('reponses') || af.reponses === true;
      const nombre = Number(this.getAttribute('nombre')) || Number(af.nombre) || 0;
      let avis = (d.avis || []).filter((a) => this.filtre === 'tous' || a.source === this.filtre);
      if (nombre) avis = avis.slice(0, nombre);
      const logo = s0 ? src(typeDe(s0.id)).svg : sources.length === 1 ? src(typeDe(sources[0].id)).svg : '';
      // Bouton : seulement si l'attribut « bouton » est posé (ou af.bouton === true). Sa valeur, si elle est écrite, est le libellé.
      const vb = this.getAttribute('bouton');
      const avecBouton = this.hasAttribute('bouton') ? !/^(non|false|0)$/i.test(vb || '') : af.bouton === true;
      const libelle = vb && !/^(oui|true|1)$/i.test(vb) ? vb : (af.texteBouton || d.libelleBouton || 'Laisser un avis');
      const plein = /^plein$/i.test(this.reglage('style-bouton', 'styleBouton') || '');
      const bouton = avecBouton && lienAvis ? `<a class="btn${plein ? ' plein' : ''}" href="${sur(lienAvis)}" target="_blank" rel="noopener">${echap(libelle)}</a>` : '';
      // En-tête : complet (défaut), compact, nombre (sans la note), non.
      const modeEntete = String(this.reglage('entete', 'entete') || 'complet').toLowerCase();
      const entete = modeEntete !== 'non';
      const modeLogo = String(this.reglage('logo', 'logo') || 'icone').toLowerCase();
      const titreEntete = this.reglage('titre-entete', 'titreEntete');
      const sourceUnique = s0 ? typeDe(s0.id) : sources.length === 1 ? typeDe(sources[0].id) : null;
      const blocLogo = modeLogo === 'aucun' ? '' : modeLogo === 'mot' && sourceUnique === 'google' ? `<span class="mot">${MOT_GOOGLE}<b>Avis</b></span>` : logo ? `<span class="logo">${logo}</span>` : '';
      const nb = (n) => (n == null || n === '' ? '' : Number(n).toLocaleString('fr-FR'));
      const pied = /^google$/i.test(this.reglage('pied', 'pied') || '');
      const centree = /^cent/i.test(this.reglage('disposition', 'disposition') || '');
      const onglets = sources.length > 1 ? `<div class="onglets" role="tablist">${[{ id: 'tous', nom: 'Tous les avis', note: d.note }, ...sources].map((s) => `<button role="tab" data-f="${echap(s.id)}" aria-selected="${this.filtre === s.id}">${s.id !== 'tous' ? `<span class="src">${src(typeDe(s.id)).svg}</span>` : ''}${echap(s.libelle || s.nom || src(typeDe(s.id)).nom)} <b>${echap(noteTexte(s.note))}</b></button>`).join('')}</div>` : '';
      const cartes = avis.map((a, i) => {
        const h = teinte(a.auteur);
        const qui = `<div class="qui"><div class="av" style="background:hsl(${h} 42% 44%)"><span class="ini">${echap(initiale(a.auteur))}</span><span class="grand">${src(typeDe(a.source)).svg}</span><span class="mini">${src(typeDe(a.source)).svg}</span></div><div><div class="nom">${echap(auteurAffiche(a.auteur))}</div><div class="date">${echap(quand(a.date) || a.dateTexte || '')}</div></div><span class="src" title="${echap(src(typeDe(a.source)).mot)}">${src(typeDe(a.source)).svg}</span></div>`;
        const corpsAvis = `<div class="ligne">${typeDe(a.source) === 'booking' ? note10('booking', a.note) : etoiles(a.note)}</div>
          ${a.titre ? `<strong>${echap(a.titre)}</strong>` : ''}<p class="txt" id="t${i}">${echap(nettoyerTexte(a.texte))}</p>
          <button class="plus" data-t="t${i}" aria-controls="t${i}" aria-expanded="false" hidden><span>Lire la suite</span>${CHEVRON('b')}</button>
          ${a.reponse && reponses ? `<p class="rep"><strong>Réponse :</strong> ${echap(nettoyerReponse(a.reponse))}</p>` : ''}`;
        const piedSrc = pied ? `<div class="pied-src">${src(typeDe(a.source)).svg}<span>Publié sur<b>${echap(src(typeDe(a.source)).nom)}</b></span></div>` : '';
        return centree ? `<article class="carte centre">${corpsAvis}${qui}${piedSrc}</article>` : `<article class="carte">${qui}${corpsAvis}${piedSrc}</article>`;
      }).join('');
      const navCote = /^c[oô]t/i.test(this.reglage('navigation', 'navigation') || '');
      const corps = modele === 'grille' ? `<div class="grille">${cartes}</div>` : navCote ? `<div class="zone"><div class="piste" tabindex="0" aria-label="Avis clients">${cartes}</div><button class="prec cote" aria-label="Avis précédents">${CHEVRON('g')}</button><button class="suiv cote" aria-label="Avis suivants">${CHEVRON('d')}</button></div><div class="points" hidden></div>` : `<div class="piste" tabindex="0" aria-label="Avis clients">${cartes}</div><div class="pied"><div class="points" role="group" aria-label="Pages d'avis"></div><div class="nav"><button class="prec" aria-label="Avis précédents">${CHEVRON('g')}</button><button class="suiv" aria-label="Avis suivants">${CHEVRON('d')}</button></div></div>`;
      const surSource = sourceUnique ? ' sur ' + echap(src(sourceUnique).nom) : '';
      let score = '<span></span>';
      if (modeEntete === 'ligne') {
        const marque = sourceUnique === 'google' && modeLogo === 'mot' ? MOT_GOOGLE : logo ? `<span class="logo">${logo}</span>` : '';
        score = `<div class="cpt ligne1">${marque}<span class="cpt-chiffre">${echap(noteTexte(note))}</span>${etoiles(Number(note) || 0, 24)}</div>`;
      } else if (modeEntete === 'compact' || modeEntete === 'nombre') {
        const pile = modeLogo === 'mot' || modeLogo === 'icone-haut';
        const titre = titreEntete ? `<div class="cpt-titre">${echap(titreEntete)}</div>` : '';
        const ligneNote = modeEntete === 'nombre'
          ? `<div class="cpt-total" style="font-size:13.5px">${echap(nb(total))} avis</div>`
          : `<div class="ligne cpt-note"><span class="cpt-chiffre">${echap(noteTexte(note))}</span>${etoiles(Number(note) || 0, 20)}<span class="cpt-total">(${echap(nb(total))})</span></div>`;
        score = `<div class="cpt${pile ? ' pile' : ''}${modeLogo === 'icone-haut' ? ' haut' : ''}">${blocLogo}<div class="cpt-t">${titre}${ligneNote}</div></div>`;
      } else if (entete) {
        score = `<div class="score">${blocLogo}<div><div class="ligne"><span class="chiffre">${echap(noteTexte(note))}</span>${etoiles(Number(note) || 0, 20)}</div><div class="total">${echap(nb(total))} avis${surSource}</div></div></div>`;
      }
      const tete = entete || bouton ? `<div class="tete">${score}${bouton}</div>` : '';
      this.shadowRoot.innerHTML = `<style>${CSS}</style><section class="w" aria-label="Avis clients">
        ${(this.getAttribute('titre') || af.titre) ? `<h2 class="titre">${echap(this.getAttribute('titre') || af.titre)}</h2>` : ''}
        ${onglets}${tete}${corps}</section>`;
      const r = this.shadowRoot;
      r.querySelectorAll('.onglets button').forEach((b) => b.addEventListener('click', () => { this.filtre = b.dataset.f; this.rendre(); }));
      // Mesuré à chaque changement de taille : un texte coupé à 1280 px peut tenir en entier ailleurs, et inversement.
      const verifier = () => r.querySelectorAll('.txt:not(.ouvert)').forEach((t) => {
        t.classList.remove('coupe'); const long = t.scrollHeight > t.clientHeight + 2;
        t.classList.toggle('coupe', long); r.querySelector(`[data-t=${t.id}]`).hidden = !long;
      });
      r.querySelectorAll('.plus').forEach((b) => b.addEventListener('click', () => {
        const t = r.getElementById(b.dataset.t); const o = t.classList.toggle('ouvert');
        b.setAttribute('aria-expanded', String(o)); b.firstElementChild.textContent = o ? 'Réduire' : 'Lire la suite';
      }));
      const piste = r.querySelector('.piste');
      let suivre = () => {};
      if (piste) {
        const points = r.querySelector('.points');
        const pas = () => { const c = piste.querySelector('.carte'); return c ? Math.max(c.offsetWidth + 18, Math.floor((piste.clientWidth + 18) / (c.offsetWidth + 18)) * (c.offsetWidth + 18)) : piste.clientWidth; };
        const pages = () => Math.max(1, Math.ceil((piste.scrollWidth - piste.clientWidth) / pas() - 0.05) + 1);
        const dessinerPoints = () => {
          const n = pages(); points.hidden = n < 2 || n > 9;
          if (points.childElementCount !== n) points.innerHTML = Array.from({ length: n }, (_, k) => `<button aria-label="Page ${k + 1} sur ${n}" data-p="${k}"></button>`).join('');
        };
        const maj = () => {
          r.querySelector('.prec').disabled = piste.scrollLeft < 4;
          r.querySelector('.suiv').disabled = piste.scrollLeft + piste.clientWidth > piste.scrollWidth - 4;
          const n = pages(), fin = piste.scrollLeft + piste.clientWidth > piste.scrollWidth - 4;
          const p = fin ? n - 1 : Math.round(piste.scrollLeft / pas());
          points.querySelectorAll('button').forEach((b, k) => b.setAttribute('aria-current', String(k === p)));
        };
        points.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) piste.scrollTo({ left: Number(b.dataset.p) * pas() }); });
        r.querySelector('.prec').addEventListener('click', () => piste.scrollBy({ left: -pas() }));
        r.querySelector('.suiv').addEventListener('click', () => piste.scrollBy({ left: pas() }));
        piste.addEventListener('scroll', maj, { passive: true });
        suivre = () => { dessinerPoints(); maj(); };
      }
      if (this.ro) this.ro.disconnect();
      this.ro = new ResizeObserver(() => { verifier(); suivre(); }); this.ro.observe(r.querySelector('.w'));
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { verifier(); suivre(); });
    }
    disconnectedCallback() { if (this.ro) this.ro.disconnect(); }
  }
  customElements.define('wapia-avis', WapiaAvis);
})();
