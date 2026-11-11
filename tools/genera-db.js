// Genera data/db.json con esercizi casuali:  node tools/genera-db.js
// Poi puoi modificare/sostituire il file a mano: l'app legge solo data/db.json.
const fs = require('fs');
const R = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a, pick = a => a[R(0, a.length - 1)];
const out = [], seen = new Set();
const many = (n, f) => { let c = 0; for (let g = 0; c < n && g < 5000; g++) { const e = f(), k = JSON.stringify(e); if (!seen.has(k)) { seen.add(k); out.push(e); c++; } } };
const distinctNums = n => { const s = new Set(); while (s.size < n) s.add(Math.random() < .4 && s.size ? Math.max(1, Math.min(100, [...s][0] + R(-12, 12))) : R(1, 100)); return [...s]; };

many(40, () => { // serie
  const step = pick([1, 2, 3, 5, 10]), up = Math.random() < .7, len = pick([5, 6]), span = step * (len - 1);
  const s0 = up ? R(1, 100 - span) : R(1 + span, 100), v = [...Array(len)].map((_, i) => up ? s0 + i * step : s0 - i * step);
  const h = new Set(), nh = pick([1, 2, 2]); while (h.size < nh) h.add(R(1, len - 1));
  return { tipo: 'serie', numeri: v.map((x, i) => h.has(i) ? null : x) };
});
many(40, () => { // salti
  let v = R(5, 90); const p = v, ops = [];
  for (let i = 0; i < 3; i++) { let d = (Math.random() < .5 ? 1 : -1) * R(1, Math.random() < .5 ? 9 : 20); if (v + d < 1 || v + d > 100) d = -d; v += d; ops.push(d); }
  return { tipo: 'salti', partenza: p, operazioni: ops };
});
many(40, () => { // confronto
  const a = R(1, 100); let b = Math.random() < .15 ? a : R(1, 100);
  if (Math.random() < .4) b = Math.max(1, Math.min(100, a + R(-9, 9)));
  return { tipo: 'confronto', a, b };
});
many(40, () => ({ tipo: 'prima_dopo', numero: R(2, 99) }));
many(30, () => ({ tipo: 'ordina', numeri: distinctNums(pick([4, 4, 5])), ordine: pick(['crescente', 'decrescente']) }));
many(30, () => ({ tipo: 'minmax', numeri: distinctNums(pick([3, 4, 5])), chiedi: pick(['minore', 'maggiore']) }));
many(25, () => { const a = R(10, 90), b = R(1, 100 - a); return { tipo: 'colonna', operazione: '+', a, b }; });
many(25, () => { const a = R(11, 99), b = R(1, a); return { tipo: 'colonna', operazione: '-', a, b }; });
many(20, () => ({ tipo: 'abaco', numero: R(1, 99), modalita: 'leggi' }));
many(20, () => ({ tipo: 'abaco', numero: R(1, 99), modalita: 'costruisci' }));

fs.writeFileSync(__dirname + '/../data/db.json', '{\n  "esercizi": [\n' + out.map(e => '    ' + JSON.stringify(e)).join(',\n') + '\n  ]\n}\n');
console.log('Scritti', out.length, 'esercizi in data/db.json');
