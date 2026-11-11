// Statistiche: salvate nel browser con la stessa struttura di data/statistiche.json ed esportabili in un file.
// "giorni" contiene i totali giorno per giorno (ultimi 120 giorni) e serve per le statistiche degli ultimi 30 giorni.
const STAT_KEY = 'matematica2.statistiche';
const zero = () => ({ svolti: 0, esatte: 0, conAiuto: 0, errate: 0, erroriTotali: 0, consecutiveEsatte: 0, maxConsecutiveEsatte: 0, tempoTotaleSec: 0 });
function newStats() { const t = new Date().toISOString(); return { versione: 2, creato: t, aggiornato: t, totale: zero(), perTipo: {}, sessioni: [], giorni: {} }; }
let STATS = (() => { try { const s = JSON.parse(localStorage.getItem(STAT_KEY)); if (s) { s.giorni = s.giorni || {}; return s; } } catch (e) {} return newStats(); })();
const dayKey = d => { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const daysAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
function saveStats() { STATS.aggiornato = new Date().toISOString(); try { localStorage.setItem(STAT_KEY, JSON.stringify(STATS)); } catch (e) {} }
function bump(o, r) {
  o.svolti++; o.erroriTotali += r.errori; o.tempoTotaleSec += Math.round(r.ms / 1000);
  if (r.esito === 'esatta') { o.esatte++; o.consecutiveEsatte++; o.maxConsecutiveEsatte = Math.max(o.maxConsecutiveEsatte, o.consecutiveEsatte); }
  else { o.consecutiveEsatte = 0; if (r.esito === 'aiuto') o.conAiuto++; else o.errate++; }
}
// esito: 'esatta' (senza aiuto) | 'aiuto' (giusta con l'aiuto) | 'errata' (risposta mostrata); errori = tentativi sbagliati
function recordResult(tipo, r) {
  bump(STATS.totale, r); bump(STATS.perTipo[tipo] = STATS.perTipo[tipo] || zero(), r);
  const k = dayKey(), g = STATS.giorni[k] = STATS.giorni[k] || { totale: zero(), perTipo: {} };
  bump(g.totale, r); bump(g.perTipo[tipo] = g.perTipo[tipo] || zero(), r);
  const old = dayKey(daysAgo(120)); Object.keys(STATS.giorni).forEach(d => { if (d < old) delete STATS.giorni[d]; });
  saveStats();
}
function recordSession(s) { STATS.sessioni.push(Object.assign({ data: new Date().toISOString() }, s)); STATS.sessioni = STATS.sessioni.slice(-100); saveStats(); }
// Somma degli ultimi 30 giorni (oggi compreso)
function monthStats() {
  const from = dayKey(daysAgo(29)), out = { totale: zero(), perTipo: {}, giorni: 0 };
  const add = (o, s) => { ['svolti', 'esatte', 'conAiuto', 'errate', 'erroriTotali', 'tempoTotaleSec'].forEach(k => o[k] += s[k]); o.maxConsecutiveEsatte = Math.max(o.maxConsecutiveEsatte, s.maxConsecutiveEsatte); };
  for (const [k, g] of Object.entries(STATS.giorni)) {
    if (k < from) continue; out.giorni++; add(out.totale, g.totale);
    for (const [t, s] of Object.entries(g.perTipo)) add(out.perTipo[t] = out.perTipo[t] || zero(), s);
  }
  return out;
}
function resetStats() { STATS = newStats(); saveStats(); }
function exportStats() { download('statistiche.json', JSON.stringify(STATS, null, 2)); }
// Verifica password (serve connessione sicura https, come su GitHub Pages)
async function sha256(t) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
async function checkPassword(pw) { try { return (await sha256(pw)) === CFG.resetPasswordHash; } catch (e) { return null; } }
