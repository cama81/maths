// Statistiche. Salvate nel browser con la stessa struttura di data/statistiche.json ed esportabili in un file.
//  totale / perTipo : contatori dall'inizio
//  giorni           : gli stessi contatori giorno per giorno (ultimi 2 anni) -> confronti e andamento nel tempo
//  errori           : elenco degli ultimi 60 esercizi sbagliati o risolti con l'aiuto (testo dell'esercizio)
//  sessioni         : ultime 100 sezioni concluse
// OWN = dati di questo dispositivo; IMPORTS = dati di altri dispositivi importati da file (un'istantanea per dispositivo, sostituita da quella più recente);
// STATS = vista unita (OWN + IMPORTS) usata dalla schermata statistiche. Senza importazioni STATS e OWN sono lo stesso oggetto.
const STAT_KEY = 'matematica2.statistiche', IMP_KEY = 'matematica2.statistiche.importate';
const FIELDS = ['svolti', 'esatte', 'conAiuto', 'errate', 'erroriTotali', 'tempoTotaleSec', 'tempoEsatteSec', 'nEsatteTempo'];
const MAX_SEC = 120; // un esercizio non conta più di 2 minuti (evita falsati se il tablet resta fermo)
const zero = () => ({ svolti: 0, esatte: 0, conAiuto: 0, errate: 0, erroriTotali: 0, consecutiveEsatte: 0, maxConsecutiveEsatte: 0, tempoTotaleSec: 0, tempoEsatteSec: 0, nEsatteTempo: 0 });
const fixObj = o => { const z = zero(); for (const k in z) if (typeof o[k] !== 'number') o[k] = z[k]; return o; };
function newStats() { const t = new Date().toISOString(); return { versione: 3, id: 'd-' + t + '-' + Math.random().toString(36).slice(2, 6), creato: t, aggiornato: t, totale: zero(), perTipo: {}, sessioni: [], giorni: {}, errori: [] }; }
function normStats(s) { // compatibile con i dati salvati dalle versioni precedenti
  s.versione = 3; if (!s.id) s.id = 'd-' + (s.creato || 'sconosciuto'); s.totale = fixObj(s.totale || zero()); s.perTipo = s.perTipo || {}; s.giorni = s.giorni || {}; s.errori = s.errori || []; s.sessioni = s.sessioni || [];
  Object.values(s.perTipo).forEach(fixObj);
  Object.values(s.giorni).forEach(g => { fixObj(g.totale); g.perTipo = g.perTipo || {}; Object.values(g.perTipo).forEach(fixObj); });
  return s;
}
let OWN = (() => { try { const s = JSON.parse(localStorage.getItem(STAT_KEY)); if (s) return normStats(s); } catch (e) {} return newStats(); })();
let IMPORTS = (() => { try { const o = JSON.parse(localStorage.getItem(IMP_KEY)) || {}; Object.values(o).forEach(x => { x.dati = normStats(x.dati); }); return o; } catch (e) { return {}; } })();
let STATS = OWN;
const dayKey = d => { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const daysAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
function saveStats() { OWN.aggiornato = new Date().toISOString(); try { localStorage.setItem(STAT_KEY, JSON.stringify(OWN)); } catch (e) {} }
function saveImports() { try { localStorage.setItem(IMP_KEY, JSON.stringify(IMPORTS)); } catch (e) {} }

function bump(o, r) {
  const sec = Math.min(MAX_SEC, Math.round(r.ms / 1000));
  o.svolti++; o.erroriTotali += r.errori; o.tempoTotaleSec += sec;
  if (r.esito === 'esatta') { o.esatte++; o.tempoEsatteSec += sec; o.nEsatteTempo++; o.consecutiveEsatte++; o.maxConsecutiveEsatte = Math.max(o.maxConsecutiveEsatte, o.consecutiveEsatte); }
  else { o.consecutiveEsatte = 0; if (r.esito === 'aiuto') o.conAiuto++; else o.errate++; }
}
// esito: 'esatta' (senza aiuto) | 'aiuto' (giusta con l'aiuto) | 'errata' (risposta mostrata); errori = tentativi sbagliati; testo = descrizione dell'esercizio
function recordResult(tipo, r) {
  bump(OWN.totale, r); bump(OWN.perTipo[tipo] = OWN.perTipo[tipo] || zero(), r);
  const k = dayKey(), g = OWN.giorni[k] = OWN.giorni[k] || { totale: zero(), perTipo: {} };
  bump(g.totale, r); bump(g.perTipo[tipo] = g.perTipo[tipo] || zero(), r);
  const old = dayKey(daysAgo(730)); Object.keys(OWN.giorni).forEach(d => { if (d < old) delete OWN.giorni[d]; });
  if (r.esito !== 'esatta') { OWN.errori.push({ data: new Date().toISOString(), tipo, esito: r.esito, testo: r.testo || '' }); OWN.errori = OWN.errori.slice(-60); }
  saveStats(); rebuild();
}
function recordSession(s) { OWN.sessioni.push(Object.assign({ data: new Date().toISOString() }, s)); OWN.sessioni = OWN.sessioni.slice(-100); saveStats(); rebuild(); }

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

// ---- Unione dei dati di più dispositivi ----
function mergeData(list) {
  const out = newStats(); out.id = OWN.id; out.creato = list.map(x => x.creato).sort()[0] || out.creato; out.aggiornato = list.map(x => x.aggiornato).sort().pop() || out.aggiornato;
  list.forEach(s => {
    addInto(out.totale, s.totale);
    Object.entries(s.perTipo).forEach(([t, o]) => addInto(out.perTipo[t] = out.perTipo[t] || zero(), o));
    Object.entries(s.giorni).forEach(([k, g]) => { const d = out.giorni[k] = out.giorni[k] || { totale: zero(), perTipo: {} }; addInto(d.totale, g.totale); Object.entries(g.perTipo).forEach(([t, o]) => addInto(d.perTipo[t] = d.perTipo[t] || zero(), o)); });
    out.errori = out.errori.concat(s.errori); out.sessioni = out.sessioni.concat(s.sessioni);
  });
  const byDate = (a, b) => a.data < b.data ? -1 : a.data > b.data ? 1 : 0;
  out.errori = out.errori.sort(byDate).slice(-60); out.sessioni = out.sessioni.sort(byDate).slice(-100);
  out.totale.consecutiveEsatte = OWN.totale.consecutiveEsatte; // la serie in corso è solo di questo dispositivo
  return out;
}
function rebuild() { const ids = Object.keys(IMPORTS); STATS = ids.length ? mergeData([OWN].concat(ids.map(i => IMPORTS[i].dati))) : OWN; }
rebuild();

const fmtD = iso => { const d = new Date(iso); return isNaN(d) ? '?' : d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }); };
// Applica un file di statistiche (pacchetto di questa versione oppure vecchia esportazione). Ripetere l'importazione non duplica i dati.
function applyStatsPackage(pkg) {
  const src = {}, res = [], errors = [];
  const ok = d => d && typeof d === 'object' && d.totale && typeof d.totale.svolti === 'number' && d.giorni && typeof d.giorni === 'object';
  if (pkg && pkg.fonti && typeof pkg.fonti === 'object') Object.entries(pkg.fonti).forEach(([id, f]) => { if (f && ok(f.dati)) { f.dati.id = id; src[id] = f.dati; } });
  else if (ok(pkg)) { const d = JSON.parse(JSON.stringify(pkg)); normStats(d); src[d.id] = d; }
  if (!Object.keys(src).length) return { fonti: [], errors: ['Il file non sembra un’esportazione di statistiche di questa app.'] };
  Object.entries(src).forEach(([id, d]) => {
    d = normStats(d); const info = { id, svolti: d.totale.svolti, aggiornato: d.aggiornato };
    if (id === OWN.id) info.esito = 'proprio';
    else if (!IMPORTS[id]) { IMPORTS[id] = { importato: new Date().toISOString(), dati: d }; info.esito = 'nuovo'; }
    else if (String(d.aggiornato) > String(IMPORTS[id].dati.aggiornato)) { IMPORTS[id] = { importato: new Date().toISOString(), dati: d }; info.esito = 'aggiornato'; }
    else info.esito = 'invariato';
    res.push(info);
  });
  saveImports(); rebuild();
  return { fonti: res, errors };
}
function statsMessage(r) {
  if (!r.fonti.length) return 'Nessuna statistica importata.';
  const t = { nuovo: 'aggiunte', aggiornato: 'aggiornate', invariato: 'già presenti, nessuna modifica', proprio: 'sono di questo dispositivo, già presenti' };
  return 'Statistiche importate: ' + r.fonti.map(f => `dati di ${f.esito === 'proprio' ? 'questo dispositivo' : 'un altro dispositivo'} (${f.svolti} esercizi, aggiornati al ${fmtD(f.aggiornato)}) ${t[f.esito]}`).join('; ') + '.';
}
function importStatsFile(file, done) {
  const rd = new FileReader();
  rd.onload = () => {
    let data; try { data = JSON.parse(rd.result); } catch (e) { return done({ msg: 'Nessuna statistica importata.', errors: ['File JSON non valido: ' + e.message] }); }
    const r = applyStatsPackage(data); done({ msg: statsMessage(r), errors: r.errors });
  };
  rd.onerror = () => done({ msg: 'Nessuna statistica importata.', errors: ['Impossibile leggere il file'] });
  rd.readAsText(file);
}
// File di esportazione: contiene i dati di questo dispositivo e di quelli già importati, così può essere importato ovunque senza duplicati
function buildPackage() {
  const fonti = { [OWN.id]: { dati: OWN } }; Object.entries(IMPORTS).forEach(([id, x]) => { fonti[id] = { dati: x.dati }; });
  const p = { formato: 'matematica-statistiche', versione: 3, deviceId: OWN.id, esportato: new Date().toISOString(), fonti };
  if (Object.keys(IMPORTS).length) p.unite = STATS;
  return p;
}
function resetStats() { OWN = newStats(); IMPORTS = {}; saveStats(); saveImports(); rebuild(); }
function exportStats() { download('statistiche.json', JSON.stringify(buildPackage(), null, 2)); }
// Verifica password (serve connessione sicura https, come su GitHub Pages)
async function sha256(t) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
async function checkPassword(pw) { try { return (await sha256(pw)) === CFG.resetPasswordHash; } catch (e) { return null; } }
