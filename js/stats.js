// Statistiche. Salvate nel browser con la stessa struttura di data/statistiche.json ed esportabili in un file.
//  totale / perTipo : contatori dall'inizio
//  giorni           : gli stessi contatori giorno per giorno (ultimi 2 anni) -> confronti e andamento nel tempo
//  errori           : elenco degli ultimi 60 esercizi sbagliati o risolti con l'aiuto (testo dell'esercizio)
//  sessioni         : ultime 100 sezioni concluse
const STAT_KEY = 'matematica2.statistiche';
const FIELDS = ['svolti', 'esatte', 'conAiuto', 'errate', 'erroriTotali', 'tempoTotaleSec', 'tempoEsatteSec', 'nEsatteTempo'];
const MAX_SEC = 120; // un esercizio non conta più di 2 minuti (evita falsati se il tablet resta fermo)
const zero = () => ({ svolti: 0, esatte: 0, conAiuto: 0, errate: 0, erroriTotali: 0, consecutiveEsatte: 0, maxConsecutiveEsatte: 0, tempoTotaleSec: 0, tempoEsatteSec: 0, nEsatteTempo: 0 });
const fixObj = o => { const z = zero(); for (const k in z) if (typeof o[k] !== 'number') o[k] = z[k]; return o; };
function newStats() { const t = new Date().toISOString(); return { versione: 3, creato: t, aggiornato: t, totale: zero(), perTipo: {}, sessioni: [], giorni: {}, errori: [] }; }
function normStats(s) { // compatibile con i dati salvati dalle versioni precedenti
  s.versione = 3; s.totale = fixObj(s.totale || zero()); s.perTipo = s.perTipo || {}; s.giorni = s.giorni || {}; s.errori = s.errori || []; s.sessioni = s.sessioni || [];
  Object.values(s.perTipo).forEach(fixObj);
  Object.values(s.giorni).forEach(g => { fixObj(g.totale); g.perTipo = g.perTipo || {}; Object.values(g.perTipo).forEach(fixObj); });
  return s;
}
let STATS = (() => { try { const s = JSON.parse(localStorage.getItem(STAT_KEY)); if (s) return normStats(s); } catch (e) {} return newStats(); })();
const dayKey = d => { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const daysAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
function saveStats() { STATS.aggiornato = new Date().toISOString(); try { localStorage.setItem(STAT_KEY, JSON.stringify(STATS)); } catch (e) {} }

function bump(o, r) {
  const sec = Math.min(MAX_SEC, Math.round(r.ms / 1000));
  o.svolti++; o.erroriTotali += r.errori; o.tempoTotaleSec += sec;
  if (r.esito === 'esatta') { o.esatte++; o.tempoEsatteSec += sec; o.nEsatteTempo++; o.consecutiveEsatte++; o.maxConsecutiveEsatte = Math.max(o.maxConsecutiveEsatte, o.consecutiveEsatte); }
  else { o.consecutiveEsatte = 0; if (r.esito === 'aiuto') o.conAiuto++; else o.errate++; }
}
// esito: 'esatta' (senza aiuto) | 'aiuto' (giusta con l'aiuto) | 'errata' (risposta mostrata); errori = tentativi sbagliati; testo = descrizione dell'esercizio
function recordResult(tipo, r) {
  bump(STATS.totale, r); bump(STATS.perTipo[tipo] = STATS.perTipo[tipo] || zero(), r);
  const k = dayKey(), g = STATS.giorni[k] = STATS.giorni[k] || { totale: zero(), perTipo: {} };
  bump(g.totale, r); bump(g.perTipo[tipo] = g.perTipo[tipo] || zero(), r);
  const old = dayKey(daysAgo(730)); Object.keys(STATS.giorni).forEach(d => { if (d < old) delete STATS.giorni[d]; });
  if (r.esito !== 'esatta') { STATS.errori.push({ data: new Date().toISOString(), tipo, esito: r.esito, testo: r.testo || '' }); STATS.errori = STATS.errori.slice(-60); }
  saveStats();
}
function recordSession(s) { STATS.sessioni.push(Object.assign({ data: new Date().toISOString() }, s)); STATS.sessioni = STATS.sessioni.slice(-100); saveStats(); }

// ---- Letture per periodo (tipo = null -> tutti i giochi) ----
function addInto(o, s) { FIELDS.forEach(k => { o[k] += s[k] || 0; }); o.maxConsecutiveEsatte = Math.max(o.maxConsecutiveEsatte, s.maxConsecutiveEsatte || 0); return o; }
function sumRange(fromKey, toKey, tipo) { // somma dei giorni tra due date (comprese)
  const out = zero(); out.giorni = 0;
  for (const [k, g] of Object.entries(STATS.giorni)) {
    if (k < fromKey || k > toKey) continue;
    const src = tipo ? g.perTipo[tipo] : g.totale; if (!src || !src.svolti) continue;
    addInto(out, src); out.giorni++;
  }
  return out;
}
const last30 = tipo => sumRange(dayKey(daysAgo(29)), dayKey(), tipo);
const prev30 = tipo => sumRange(dayKey(daysAgo(59)), dayKey(daysAgo(30)), tipo);
function allTime(tipo) { const o = addInto(zero(), tipo ? (STATS.perTipo[tipo] || zero()) : STATS.totale); o.giorni = sumRange('0000', '9999', tipo).giorni; return o; }
function beforeLast30(tipo) { // tutto ciò che c'è prima degli ultimi 30 giorni
  const a = allTime(tipo), b = last30(tipo), o = zero();
  FIELDS.forEach(k => { o[k] = Math.max(0, a[k] - b[k]); }); return o;
}
function firstDayKey(tipo) { let m = '9999-99-99'; for (const [k, g] of Object.entries(STATS.giorni)) { const s = tipo ? g.perTipo[tipo] : g.totale; if (s && s.svolti && k < m) m = k; } return m; }
function monthStats() { const o = last30(null), per = {}; Object.keys(STATS.perTipo).forEach(t => { per[t] = last30(t); }); return { totale: o, perTipo: per, giorni: o.giorni }; }

function resetStats() { STATS = newStats(); saveStats(); }
function exportStats() { download('statistiche.json', JSON.stringify(STATS, null, 2)); }
// Verifica password (serve connessione sicura https, come su GitHub Pages)
async function sha256(t) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
async function checkPassword(pw) { try { return (await sha256(pw)) === CFG.resetPasswordHash; } catch (e) { return null; } }
