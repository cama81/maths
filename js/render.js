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
function abSVG(d, u) {
  const rod = (x, n, col, l) => {
    let s = `<line x1="${x}" y1="20" x2="${x}" y2="250" stroke="#8a7a5a" stroke-width="6" stroke-linecap="round"/>`;
    for (let i = 0; i < n; i++) s += `<circle cx="${x}" cy="${232 - i * 24}" r="12" fill="${col}"/>`;
    return s + `<text x="${x}" y="276" text-anchor="middle" font-size="16" font-weight="700" fill="currentColor">${l}</text>`;
  };
  return `<div class="ab" id="abw"><svg viewBox="0 0 260 285" width="230"><rect x="10" y="250" width="240" height="8" rx="4" fill="#8a7a5a"/>${rod(75, d, '#4f7cff', 'Decine')}${rod(185, u, '#ff8a3d', 'Unità')}</svg></div>`;
}
function padHTML() {
  return `<div class="pad">${[1,2,3,4,5,6,7,8,9].map(d => `<button onclick="key('${d}')">${d}</button>`).join('')}<button onclick="key('x')">⌫</button><button onclick="key('0')">0</button><button class="go" onclick="check()">OK</button></div>`;
}
function shell(inner) {
  const n = S ? S.list.length : 0, i = S ? S.i : 0;
  $('#app').innerHTML = `<div class="top"><button onclick="home()">← Menu</button><div class="prog">${i + 1} / ${n}</div><div class="stars">⭐ ${stars}</div></div><div class="bar"><i style="width:${n ? i / n * 100 : 0}%"></i></div><div class="card">${inner}</div>`;
}
