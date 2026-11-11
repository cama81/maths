// Statistiche: salvate nel browser con la stessa struttura di data/statistiche.json ed esportabili in un file
const STAT_KEY = 'matematica2.statistiche';
const zero = () => ({ svolti: 0, esatte: 0, conAiuto: 0, errate: 0, erroriTotali: 0, consecutiveEsatte: 0, maxConsecutiveEsatte: 0, tempoTotaleSec: 0 });
function newStats() { const t = new Date().toISOString(); return { versione: 1, creato: t, aggiornato: t, totale: zero(), perTipo: {}, sessioni: [] }; }
let STATS = (() => { try { return JSON.parse(localStorage.getItem(STAT_KEY)) || newStats(); } catch (e) { return newStats(); } })();
function saveStats() { STATS.aggiornato = new Date().toISOString(); try { localStorage.setItem(STAT_KEY, JSON.stringify(STATS)); } catch (e) {} }
function bump(o, r) {
  o.svolti++; o.erroriTotali += r.errori; o.tempoTotaleSec += Math.round(r.ms / 1000);
  if (r.esito === 'esatta') { o.esatte++; o.consecutiveEsatte++; o.maxConsecutiveEsatte = Math.max(o.maxConsecutiveEsatte, o.consecutiveEsatte); }
  else { o.consecutiveEsatte = 0; if (r.esito === 'aiuto') o.conAiuto++; else o.errate++; }
}
// esito: 'esatta' (senza aiuto) | 'aiuto' (giusta con l'aiuto) | 'errata' (risposta mostrata); errori = tentativi sbagliati
function recordResult(tipo, r) { bump(STATS.totale, r); bump(STATS.perTipo[tipo] = STATS.perTipo[tipo] || zero(), r); saveStats(); }
function recordSession(s) { STATS.sessioni.push(Object.assign({ data: new Date().toISOString() }, s)); STATS.sessioni = STATS.sessioni.slice(-100); saveStats(); }
function exportStats() { download('statistiche.json', JSON.stringify(STATS, null, 2)); }
function statsLine() { const t = STATS.totale; return t.svolti ? `Esercizi svolti: ${t.svolti} · esatte: ${t.esatte} · record di fila: ${t.maxConsecutiveEsatte}` : ''; }
