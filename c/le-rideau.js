/*! Wapia — module d'avis, lien de le-rideau. Ce fichier ne change jamais : il charge la version publiée du module. */
(() => {
  if (customElements.get('wapia-avis')) return;
  const charger = (src) => { const s = document.createElement('script'); s.src = src; s.async = true; s.dataset.client = "le-rideau"; document.head.appendChild(s); };
  fetch('https://raw.githubusercontent.com/WapitixAgency/wapia-avis/main/version.json', { cache: 'no-cache', credentials: 'omit' })
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((v) => { if (!/^[0-9a-f]{7,40}$/.test(v.commit)) throw new Error('version'); charger('https://cdn.jsdelivr.net/gh/WapitixAgency/wapia-avis@' + v.commit + '/widget-avis.js'); })
    .catch(() => charger('https://cdn.jsdelivr.net/gh/WapitixAgency/wapia-avis@main/widget-avis.js'));
})();
