// Disegno dell'interfaccia: archetti, caselle, abaco, tastierino
function hopHTML(d) {
  if (d > 0) return `<svg class="hop up" viewBox="0 0 40 56" aria-label="${signed(d)}"><text x="20" y="12">${signed(d)}</text><path d="M3 34 Q20 -2 37 34"/><polygon points="37,37 31,29 41,30"/></svg>`;
  return `<svg class="hop down" viewBox="0 0 40 56" aria-label="${signed(d)}"><path d="M3 22 Q20 58 37 22"/><polygon points="37,19 31,27 41,26"/><text x="20" y="54">${signed(d)}</text></svg>`;
}
function cellsHTML(m) {
  let slot = 0;
  return m.cells.map((v, i) => {
    const box = v === null ? `<div class="slot" id="s${slot++}"></div>` : `<div class="n">${v}</div>`;
    return (i > 0 && m.deltas[i - 1] ? hopHTML(m.deltas[i - 1]) : '') + box;
  }).join('');
}
// Calcolo in colonna: intestazione h/da/u, riporto/cambio, due numeri, riga, risultato (le caselle hanno id s0, s1... nell'ordine delle risposte)
function colHTML(m) {
  const { op, a, b, r, ncols, carry } = m.col, nc = ncols + 2; // colonna etichette a sinistra + cifre + colonna del segno a destra
  const ids = { u: 0 }; let k = 1; if (carry) ids.c = k++; ids.t = k++; ids.h = k++;
  const cc = (t, cls = '') => `<div class="cc ${cls}">${t}</div>`, sl = (i, cls = '') => `<div class="cc"><div class="slot ${cls}" id="s${i}"></div></div>`;
  const place = j => ncols - 1 - j === 0 ? 'u' : ncols - 1 - j === 1 ? 't' : 'h'; // colonna j (0 = a sinistra)
  const digits = n => String(n).padStart(ncols, ' ').split('').map(c => c === ' ' ? '' : c);
  const head = cc('') + ['h', 'da', 'u'].slice(3 - ncols).map(t => cc(t, 'hd')).join('') + cc('');
  const carryRow = carry ? cc(op === '+' ? 'riporto' : 'cambio', 'lab') + [...Array(ncols)].map((_, j) => place(j) === 't' ? sl(ids.c, 'sm') : cc('')).join('') + cc('') : '';
  const num = (n, sign) => cc('') + digits(n).map((d, j) => cc(d, place(j))).join('') + cc(sign, sign ? 'op' : '');
  const res = cc('') + [...Array(ncols)].map((_, j) => { const p = place(j);
    return p === 'u' ? sl(0) : p === 't' ? (r >= 10 ? sl(ids.t) : cc('')) : (r >= 100 ? sl(ids.h) : cc('')); }).join('') + cc('');
  // il segno dell'operazione sta a destra del primo numero, come si scrive a scuola
  return `<div class="col" style="grid-template-columns:repeat(${nc},auto)">${head}${carryRow}${num(a, op === '+' ? '+' : '−')}${num(b, '')}<div class="cline"></div>${res}</div>
  <p class="sub small">Comincia dalle unità, poi vai a sinistra!</p>`;
}
// Numero mancante: 20 + [ ] + 5 = 75
function missHTML(m) {
  const items = m.cells.map(v => v === null ? '<div class="slot" id="s0"></div>' : `<div class="n">${v}</div>`).join('<div class="op">+</div>');
  return `<div class="row eq">${items}<div class="op">=</div><div class="n tg">${m.miss.total}</div></div>`;
}
function abSVG(d, u) {
  const rod = (x, n, col, l) => {
    let s = `<line x1="${x}" y1="20" x2="${x}" y2="250" stroke="#d9a441" stroke-width="6" stroke-linecap="round"/>`;
    for (let i = 0; i < n; i++) s += `<circle cx="${x}" cy="${232 - i * 24}" r="12" fill="${col}"/>`;
    return s + `<text x="${x}" y="276" text-anchor="middle" font-size="16" font-weight="700" fill="currentColor">${l}</text>`;
  };
  return `<div class="ab" id="abw"><svg viewBox="0 0 260 285" width="230"><rect x="10" y="250" width="240" height="8" rx="4" fill="#d9a441"/>${rod(75, d, '#8e63d1', 'Decine')}${rod(185, u, '#ff6fae', 'Unità')}</svg></div>`;
}
function padHTML() {
  return `<div class="pad">${[1,2,3,4,5,6,7,8,9].map(d => `<button onclick="key('${d}')">${d}</button>`).join('')}<button onclick="key('x')">⌫</button><button onclick="key('0')">0</button><button class="go" onclick="check()">OK</button></div>`;
}
function shell(inner) {
  const n = S ? S.list.length : 0, i = S ? S.i : 0;
  $('#app').innerHTML = `<div class="top">${mode === 'mix' ? '<button disabled title="Finisci il mix per tornare al menu">🔒 Menu</button>' : '<button onclick="quitSection()">← Menu</button>'}<div class="prog">${i + 1} / ${n}</div><div class="stars">⭐ ${stars}</div></div><div class="bar"><i style="width:${n ? i / n * 100 : 0}%"></i></div><div class="card">${inner}</div>`;
}

