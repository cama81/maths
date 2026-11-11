// Generatori di esercizi casuali. Ogni esercizio è un "modello" uniforme:
//  kind 'fill'  -> cells (numero o null = da inserire), deltas (salto tra una cella e la successiva), ans (risposte in ordine)
//  kind 'cmp'   -> a, b
//  kind 'build' -> v (numero da costruire sull'abaco)
const MODES = {
  serie: { icon: '🔢', name: 'Serie di numeri' },
  salti: { icon: '➕', name: 'Più e meno' },
  conf:  { icon: '⚖️', name: 'Minore o maggiore' },
  pd:    { icon: '↔️', name: 'Prima e dopo' },
  abaco: { icon: '🧮', name: 'L’abaco' }
};

// Costruisce un modello 'fill' da valori completi e indici nascosti
function mkFill(mode, title, values, hidden, deltas, extra) {
  const h = new Set(hidden);
  return Object.assign({
    kind: 'fill', mode, title, deltas,
    cells: values.map((v, i) => h.has(i) ? null : v),
    ans: values.filter((_, i) => h.has(i))
  }, extra || {});
}

const GEN = {
  serie() {
    const step = pick([1, 2, 5, 10, 10, 2, 5]), up = Math.random() < .7, len = 6, span = step * (len - 1);
    const s0 = up ? R(1, 100 - span) : R(1 + span, 100);
    const vals = [...Array(len)].map((_, i) => up ? s0 + i * step : s0 - i * step);
    const hid = new Set(); while (hid.size < 2) hid.add(R(1, len - 1));
    const d = up ? step : -step;
    return mkFill('serie', `Completa la serie: si va ${up ? 'avanti' : 'indietro'} di ${step} in ${step}`,
      vals, [...hid], Array(len - 1).fill(d));
  },
  salti() {
    let v = R(5, 90); const vals = [v], deltas = [];
    for (let i = 0; i < 3; i++) {
      let d = (Math.random() < .5 ? 1 : -1) * R(1, Math.random() < .5 ? 9 : 20);
      if (v + d < 1 || v + d > 100) d = -d;
      v += d; vals.push(v); deltas.push(d);
    }
    return mkFill('salti', 'Segui le frecce: fai un calcolo dopo l’altro', vals, [1, 2, 3], deltas);
  },
  conf() {
    const a = R(1, 100);
    let b = Math.random() < .15 ? a : R(1, 100);
    if (Math.random() < .4) b = Math.max(1, Math.min(100, a + R(-9, 9)));
    return { kind: 'cmp', mode: 'conf', a, b };
  },
  pd() {
    return pdModel(R(2, 99), pick(['entrambi', 'prima', 'dopo']));
  },
  abaco() {
    const v = R(1, 99);
    if (Math.random() < .5) return abLeggi(v);
    return { kind: 'build', mode: 'abaco', v };
  }
};

function pdModel(x, ask) {
  if (ask === 'prima') return mkFill('pd', `Che numero viene PRIMA del ${x}?`, [x - 1, x], [0], [-1]);
  if (ask === 'dopo') return mkFill('pd', `Che numero viene DOPO il ${x}?`, [x, x + 1], [1], [1]);
  return mkFill('pd', `Quali numeri stanno accanto al ${x}?`, [x - 1, x, x + 1], [0, 2], [-1, 1]);
}
function abLeggi(v) {
  return mkFill('abaco', 'Che numero è rappresentato sull’abaco?', [v], [0], [], { abaco: v });
}
