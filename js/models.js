// Modelli degli esercizi: conversione delle voci di data/db.json in esercizi giocabili + soluzioni di aiuto.
//  kind 'fill'  -> cells (numero o null = da inserire), deltas (salto tra caselle), ans (risposte in ordine)
//  kind 'cmp'   -> a, b          kind 'pick'  -> nums, ask ('min'|'max')
//  kind 'order' -> nums, dir ('cresc'|'decr')          kind 'build' -> v (numero da costruire sull'abaco)
const MODES = {
  serie: { c: '#ff6fae', icon: '🔢', name: 'Serie di numeri' },
  salti: { c: '#1fb5a3', icon: '➕', name: 'Più e meno' },
  conf:  { c: '#f5b82e', icon: '⚖️', name: 'Quale segno?' },
  pd:    { c: '#9b6bd6', icon: '↔️', name: 'Prima e dopo' },
  ord:   { c: '#5db7f0', icon: '📶', name: 'Metti in ordine' },
  mm:    { c: '#e8456b', icon: '🎯', name: 'Il più piccolo e il più grande' },
  abaco: { c: '#4fb477', icon: '🧮', name: 'L’abaco' }
};
const inR = n => Number.isInteger(n) && n >= 0 && n <= 100;

function mkFill(mode, title, values, hidden, deltas, extra) {
  const h = new Set(hidden);
  return Object.assign({ kind: 'fill', mode, title, deltas,
    cells: values.map((v, i) => h.has(i) ? null : v),
    ans: values.filter((_, i) => h.has(i)) }, extra || {});
}
// Prima e dopo: l'esercizio chiede SEMPRE il numero precedente e il successivo
const pdModel = x => mkFill('pd', `Quali numeri stanno accanto al ${x}?`, [x - 1, x, x + 1], [0, 2], [-1, 1]);
const abLeggi = v => mkFill('abaco', 'Che numero è rappresentato sull’abaco?', [v], [0], [], { abaco: v });
const distinct = n => Array.isArray(n) && new Set(n).size === n.length && n.every(inR);

// Converte una voce del file in un esercizio; lancia Error con messaggio in italiano se non valida
function parseOne(e) {
  const t = e && e.tipo;
  if (t === 'serie') {
    const n = e.numeri;
    if (!Array.isArray(n) || n.length < 3 || n.length > 10) throw new Error('"numeri" deve avere da 3 a 10 elementi');
    if (n.some(x => x !== null && !inR(x))) throw new Error('i numeri devono essere interi da 0 a 100 (o null)');
    const known = n.map((v, i) => v === null ? -1 : i).filter(i => i >= 0);
    if (known.length < 2 || known.length === n.length) throw new Error('servono almeno 2 numeri noti e almeno un null');
    const [i, j] = known, step = (n[j] - n[i]) / (j - i);
    if (!Number.isInteger(step) || step === 0) throw new Error('non riesco a ricavare un passo regolare');
    const vals = n.map((_, k) => n[i] + step * (k - i));
    if (vals.some(v => !inR(v)) || known.some(k => vals[k] !== n[k])) throw new Error('la serie non è regolare o esce da 0–100');
    const a = Math.abs(step);
    return mkFill('serie', e.titolo || `Completa la serie: si va ${step > 0 ? 'avanti' : 'indietro'} di ${a} in ${a}`,
      vals, n.map((v, k) => v === null ? k : -1).filter(k => k >= 0), Array(n.length - 1).fill(step));
  }
  if (t === 'salti') {
    const ops = e.operazioni;
    if (!inR(e.partenza) || !Array.isArray(ops) || ops.length < 1 || ops.length > 5 || ops.some(x => !Number.isInteger(x) || x === 0)) throw new Error('servono "partenza" e da 1 a 5 "operazioni" (interi diversi da 0)');
    const vals = [e.partenza]; ops.forEach(d => vals.push(vals[vals.length - 1] + d));
    if (vals.some(v => !inR(v))) throw new Error('i risultati escono da 0–100');
    return mkFill('salti', e.titolo || 'Segui le frecce: fai un calcolo dopo l’altro', vals, vals.map((_, k) => k).slice(1), ops);
  }
  if (t === 'confronto') {
    if (!inR(e.a) || !inR(e.b)) throw new Error('"a" e "b" devono essere interi da 0 a 100');
    return { kind: 'cmp', mode: 'conf', a: e.a, b: e.b };
  }
  if (t === 'prima_dopo') {
    if (!Number.isInteger(e.numero) || e.numero < 1 || e.numero > 99) throw new Error('"numero" deve essere intero da 1 a 99');
    return pdModel(e.numero);
  }
  if (t === 'ordina') {
    if (!distinct(e.numeri) || e.numeri.length < 3 || e.numeri.length > 6) throw new Error('"numeri": da 3 a 6 interi diversi da 0 a 100');
    if (!['crescente', 'decrescente'].includes(e.ordine)) throw new Error('"ordine" deve essere crescente o decrescente');
    return { kind: 'order', mode: 'ord', nums: e.numeri, dir: e.ordine === 'crescente' ? 'cresc' : 'decr' };
  }
  if (t === 'minmax') {
    if (!distinct(e.numeri) || e.numeri.length < 3 || e.numeri.length > 6) throw new Error('"numeri": da 3 a 6 interi diversi da 0 a 100');
    if (!['minore', 'maggiore'].includes(e.chiedi)) throw new Error('"chiedi" deve essere minore o maggiore');
    return { kind: 'pick', mode: 'mm', nums: e.numeri, ask: e.chiedi === 'minore' ? 'min' : 'max' };
  }
  if (t === 'abaco') {
    if (!Number.isInteger(e.numero) || e.numero < 0 || e.numero > 99) throw new Error('"numero" deve essere intero da 0 a 99');
    if (e.modalita === 'costruisci') return { kind: 'build', mode: 'abaco', v: e.numero };
    if (e.modalita && e.modalita !== 'leggi') throw new Error('"modalita" deve essere leggi o costruisci');
    return abLeggi(e.numero);
  }
  throw new Error('"tipo" sconosciuto (serie, salti, confronto, prima_dopo, ordina, minmax, abaco)');
}

// ---- Soluzioni proposte dal pulsante Aiuto (1 giusta + 2 sbagliate, mescolate) ----
function pickDistractors(cands, correctKey, make) {
  const seen = new Set([correctKey]), ds = [];
  for (const c of shuffle(cands)) { const k = JSON.stringify(c); if (c && !seen.has(k)) { seen.add(k); ds.push(c); if (ds.length === 2) break; } }
  for (let g = 0; ds.length < 2 && g < 200; g++) { const c = make(), k = JSON.stringify(c); if (!seen.has(k)) { seen.add(k); ds.push(c); } }
  return ds;
}
function fillOptions(ans) {
  const ok = a => a.every(x => x >= 0 && x <= 100) ? a : null;
  const cands = [ans.map(a => a + 1), ans.map(a => a - 1), ans.map(a => a + 10), ans.map(a => a - 10), ans.slice().reverse(),
    ans.map(a => a >= 10 ? (a % 10) * 10 + Math.floor(a / 10) : a + 2)].map(ok);
  const ds = pickDistractors(cands, JSON.stringify(ans), () => ok(ans.map(a => a + (R(-3, 3) || 2))));
  return shuffle([{ v: ans, ok: true }, ...ds.map(v => ({ v, ok: false }))]);
}
function orderOptions(s) {
  const sw = (i, j) => { const a = s.slice(); [a[i], a[j]] = [a[j], a[i]]; return a; };
  const ds = pickDistractors([s.slice().reverse(), sw(0, 1), sw(s.length - 2, s.length - 1), sw(0, s.length - 1)], JSON.stringify(s), () => shuffle(s));
  return shuffle([{ v: s, ok: true }, ...ds.map(v => ({ v, ok: false }))]);
}
function buildOptions(v) {
  const d = Math.floor(v / 10), u = v % 10, ok = p => p[0] >= 0 && p[0] <= 9 && p[1] >= 0 && p[1] <= 9 ? p : null;
  const ds = pickDistractors([[u, d], [d + 1, u], [d - 1, u], [d, u + 1], [d, u - 1]].map(ok), JSON.stringify([d, u]), () => [R(0, 9), R(0, 9)]);
  return shuffle([{ d, u, ok: true }, ...ds.map(p => ({ d: p[0], u: p[1], ok: false }))]);
}
