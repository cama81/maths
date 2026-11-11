// Funzioni di utilità condivise
const $ = s => document.querySelector(s);
const R = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = a => a[R(0, a.length - 1)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = R(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const signed = d => (d > 0 ? '+' : '−') + Math.abs(d);
const sample = (a, n) => { if (!a.length) return []; let o = []; while (o.length < n) o = o.concat(shuffle(a)); return o.slice(0, n); };
const download = (name, text) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name; a.click(); };
const APP_VERSION = '1.4.0'; // da aggiornare insieme a VERSION in sw.js
