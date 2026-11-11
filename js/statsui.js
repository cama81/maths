// Schermata statistiche per genitori e insegnanti: quadro generale, confronto con il periodo precedente,
// andamento nel tempo (grafici) e dettaglio per ogni gioco. (statView è dichiarata in app.js)
let statGame = null;

const pc = v => v == null ? '–' : Math.round(v) + '%';
const fmtT = s => s == null ? '–' : s < 60 ? Math.round(s) + ' s' : Math.floor(s / 60) + ' min ' + String(Math.round(s % 60)).padStart(2, '0') + ' s';
function mt(o) { const n = o.svolti; return { n, pe: n ? o.esatte / n * 100 : null, pa: n ? o.conAiuto / n * 100 : null, pg: n ? o.errate / n * 100 : null,
  er: n ? o.erroriTotali / n : null, t: o.nEsatteTempo ? o.tempoEsatteSec / o.nEsatteTempo : null, min: o.tempoTotaleSec / 60 }; }

// Freccetta di confronto con il periodo precedente. kind: pct (più alto è meglio) | inv (più basso è meglio) | time (più basso è meglio) | cnt
function dlt(cur, prev, kind) {
  if (!prev || cur == null || prev.v == null || cur.n < 5 || prev.n < 5) return '';
  const d = cur.v - prev.v, small = kind === 'time' ? Math.abs(d) < 1 : kind === 'cnt' ? d === 0 : Math.abs(d) < 2;
  if (small) return '<span class="delta eq">▬ stabile</span>';
  const better = kind === 'pct' || kind === 'cnt' ? d > 0 : d < 0, txt = kind === 'time' ? Math.abs(Math.round(d)) + ' s' : kind === 'cnt' ? Math.abs(d) : Math.abs(Math.round(d)) + ' pt';
  return `<span class="delta ${better ? 'up' : 'dn'}">${d > 0 ? '▲' : '▼'} ${d > 0 ? '+' : '−'}${txt}</span>`;
}

// Grafico a linea semplice (SVG, funziona anche offline). pts: [{l: etichetta, v: valore|null}]
function lineChart(pts, unit, color, fixed) {
  const vals = pts.map(p => p.v).filter(v => v != null);
  if (vals.length < 2) return '<p class="sub small">Servono più giorni di gioco per vedere l’andamento.</p>';
  const W = 300, H = 118, pl = 34, pr = 10, pt = 12, pb = 24;
  let lo = fixed ? fixed[0] : Math.min(...vals), hi = fixed ? fixed[1] : Math.max(...vals);
  if (!fixed) { if (hi - lo < 2) { lo -= 1; hi += 1; } const pad = (hi - lo) * .2; lo = Math.max(0, lo - pad); hi += pad; if (unit === '%') hi = Math.min(100, hi); }
  const X = i => pl + i * (W - pl - pr) / (pts.length - 1), Y = v => pt + (H - pt - pb) * (1 - (v - lo) / (hi - lo));
  let d = '', on = false;
  pts.forEach((p, i) => { if (p.v == null) { on = false; return; } d += (on ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p.v).toFixed(1) + ' '; on = true; });
  const dots = pts.map((p, i) => p.v == null ? '' : `<circle cx="${X(i).toFixed(1)}" cy="${Y(p.v).toFixed(1)}" r="3.5"><title>${p.l}: ${Math.round(p.v)}${unit}</title></circle>`).join('');
  const lab = (x, t, a) => `<text x="${x}" y="${H - 8}" text-anchor="${a}">${t}</text>`;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" style="color:${color}" role="img">
    <line class="gl" x1="${pl}" x2="${W - pr}" y1="${Y(hi).toFixed(1)}" y2="${Y(hi).toFixed(1)}"/><line class="gl" x1="${pl}" x2="${W - pr}" y1="${Y(lo).toFixed(1)}" y2="${Y(lo).toFixed(1)}"/>
    <text x="${pl - 4}" y="${(Y(hi) + 3).toFixed(1)}" text-anchor="end">${Math.round(hi)}${unit}</text><text x="${pl - 4}" y="${(Y(lo) + 3).toFixed(1)}" text-anchor="end">${Math.round(lo)}${unit}</text>
    <path class="ln" d="${d}"/>${dots}${lab(pl, pts[0].l, 'start')}${lab(W - pr, pts[pts.length - 1].l, 'end')}</svg>`;
}

// Punti del grafico: 30 giorni -> 5 blocchi da 6 giorni; dall'inizio -> settimane (fino a 12 settimane) oppure mesi (fino a 12)
function buckets(tipo) {
  const first = firstDayKey(tipo), out = [];
  let nd = 6, cnt = 5, unit = 'ogni 6 giorni';
  if (statView === 'sempre') {
    const span = first === '9999-99-99' ? 1 : Math.ceil((new Date(dayKey()) - new Date(first)) / 864e5) + 1;
    if (span <= 84) { nd = 7; cnt = Math.max(2, Math.min(12, Math.ceil(span / 7))); unit = 'per settimana'; } else { nd = 30; cnt = Math.min(12, Math.ceil(span / 30)); unit = 'per mese'; }
  }
  for (let i = cnt - 1; i >= 0; i--) {
    const from = i * nd + nd - 1, o = sumRange(dayKey(daysAgo(from)), dayKey(daysAgo(i * nd)), tipo), m = mt(o), d = daysAgo(from);
    out.push({ l: `${d.getDate()}/${d.getMonth() + 1}`, pe: o.svolti >= 3 ? m.pe : null, pa: o.svolti >= 3 ? m.pa : null, t: o.nEsatteTempo >= 3 ? m.t : null });
  }
  return { pts: out, unit };
}

// Frasi di sintesi: ultimi 30 giorni a confronto con il periodo precedente
function insights(c, p, label) {
  const a = mt(c), b = mt(p), L = [];
  if (a.n < 10) L.push(`Per ora gli esercizi svolti negli ultimi 30 giorni sono pochi (${a.n}): ne servono almeno 10 per un quadro affidabile.`);
  if (a.n >= 5 && b.n >= 5) {
    const d = a.pe - b.pe;
    L.push(Math.abs(d) < 2 ? `Le risposte esatte sono stabili (${pc(a.pe)}) ${label}.` : `Le risposte esatte sono ${d > 0 ? 'salite' : 'scese'} dal ${pc(b.pe)} al ${pc(a.pe)} ${label}.`);
    const da = a.pa - b.pa; if (Math.abs(da) >= 2) L.push(`Il ricorso all’aiuto è ${da < 0 ? 'diminuito' : 'aumentato'} (dal ${pc(b.pa)} al ${pc(a.pa)}).`);
    if (a.t != null && b.t != null && Math.abs(a.t - b.t) >= 1) L.push(`Il tempo per rispondere correttamente è ${a.t < b.t ? 'sceso' : 'salito'} da ${fmtT(b.t)} a ${fmtT(a.t)}.`);
  } else if (a.n >= 5) L.push('Non ci sono ancora abbastanza esercizi nel periodo di confronto per vedere un miglioramento: continua a giocare!');
  return L;
}

function setStatView(v) { statView = v; statsScreen(); }
function setStatGame(g) { statGame = g || null; statsScreen(); }

function statsScreen() {
  mode = 'stats';
  const month = statView === 'mese', G = statGame, name = k => k === 'mix' ? '🎲 Mix' : MODES[k] ? `${MODES[k].icon} ${MODES[k].name}` : k;
  const cur = month ? last30(G) : allTime(G), prv = month ? prev30(G) : null;
  const m = mt(cur), pm = prv ? mt(prv) : null, n5 = o => ({ n: o.n });
  const dd = (kind, key) => pm ? dlt({ n: m.n, v: m[key] }, { n: pm.n, v: pm[key] }, kind) : '';
  const kp = (b, label, d) => `<div><b>${b}</b>${label}${d || ''}</div>`;
  const hasData = cur.svolti > 0;
  const label = month ? 'rispetto ai 30 giorni precedenti' : 'rispetto a prima';
  const ins = insights(last30(G), month ? prev30(G) : beforeLast30(G), label);
  // punti di forza / da rafforzare (solo sul quadro generale)
  if (!G && hasData) {
    const rows = Object.keys(MODES).map(k => ({ k, o: month ? last30(k) : allTime(k) })).filter(x => x.o.svolti >= 5).map(x => ({ k: x.k, m: mt(x.o) })).sort((a, b) => b.m.pe - a.m.pe);
    if (rows.length >= 2) ins.push(`Più sicura in ${name(rows[0].k)} (${pc(rows[0].m.pe)} esatte). Da rafforzare: ${name(rows[rows.length - 1].k)} (${pc(rows[rows.length - 1].m.pe)} esatte, aiuto nel ${pc(rows[rows.length - 1].m.pa)} dei casi).`);
  }
  const bk = buckets(G);
  const tbl = Object.entries(MODES).map(([k, g]) => {
    const o = month ? last30(k) : allTime(k), x = mt(o), tr = dlt({ n: mt(last30(k)).n, v: mt(last30(k)).pe }, { n: mt(prev30(k)).n, v: mt(prev30(k)).pe }, 'pct');
    return `<tr class="${G === k ? 'sel' : ''}" onclick="setStatGame('${G === k ? '' : k}')"><td>${g.icon} ${g.name}</td><td>${x.n}</td><td>${pc(x.pe)}</td><td>${pc(x.pa)}</td><td>${fmtT(x.t)}</td><td>${tr || '–'}</td></tr>`;
  }).join('');
  const from = daysAgo(29); from.setHours(0, 0, 0, 0);
  const rev = STATS.errori.filter(e => (!G || e.tipo === G) && (!month || new Date(e.data) >= from)).slice(-10).reverse().map(e =>
    `<div class="sess"><span>${MODES[e.tipo] ? MODES[e.tipo].icon : ''} ${e.testo}<br><small>${new Date(e.data).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}</small></span><span class="${e.esito === 'errata' ? 'r' : 'y'}">${e.esito === 'errata' ? 'sbagliata' : 'con aiuto'}</span></div>`).join('');
  const sess = STATS.sessioni.filter(x => (!month || new Date(x.data) >= from) && (!G || x.sezione === G)).slice(-6).reverse().map(x =>
    `<div class="sess"><span>${name(x.sezione)}<br><small>${new Date(x.data).toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</small></span><span>${x.esatte} ✓ · ${x.conAiuto} 💡 · ${x.errate} ✗<br><small>su ${x.totale}</small></span></div>`).join('');
  $('#app').innerHTML = `<div class="top"><button onclick="home()">← Menu</button><h2 class="ttl">📊 Statistiche</h2><span style="width:70px"></span></div>
  <div class="seg"><button class="${month ? '' : 'on'}" onclick="setStatView('sempre')">Dall’inizio</button><button class="${month ? 'on' : ''}" onclick="setStatView('mese')">Ultimi 30 giorni</button></div>
  ${G ? `<div class="chip">Dettaglio: <b>${name(G)}</b> <button onclick="setStatGame('')">✕ tutti i giochi</button></div>` : ''}
  ${hasData ? `<div class="card"><h3>Quadro ${G ? 'del gioco' : 'generale'}${month ? '' : ' dall’inizio'}</h3><div class="grid3">
    ${kp(cur.svolti, 'esercizi svolti', pm ? dlt({ n: m.n, v: m.n }, { n: pm.n, v: pm.n }, 'cnt') : '')}${kp(pc(m.pe), 'esatte senza aiuto', dd('pct', 'pe'))}${kp(pc(m.pa), 'con aiuto', dd('inv', 'pa'))}
    ${kp(pc(m.pg), 'sbagliate', dd('inv', 'pg'))}${kp(m.er.toFixed(1), 'errori per esercizio', dd('inv', 'er'))}${kp(fmtT(m.t), 'tempo per risposta esatta', dd('time', 't'))}
    ${kp(cur.giorni, 'giorni di gioco')}${kp(Math.round(m.min), 'minuti di gioco')}${kp(cur.maxConsecutiveEsatte, 'record di esatte di fila')}</div>
    ${month ? '<p class="note">Le freccette confrontano con i 30 giorni precedenti (servono almeno 5 esercizi in entrambi i periodi).</p>' : ''}</div>
  ${ins.length ? `<div class="card"><h3>Come sta andando</h3><ul class="ins">${ins.map(t => `<li>${t}</li>`).join('')}</ul></div>` : ''}
  <div class="card"><h3>Andamento <small>${bk.unit}</small></h3><p class="small" style="margin:0 0 2px"><b>Risposte esatte senza aiuto</b> (la scala si adatta ai valori)</p>${lineChart(bk.pts.map(p => ({ l: p.l, v: p.pe })), '%', 'var(--ok)')}
    <p class="small" style="margin:10px 0 2px"><b>Ricorso all’aiuto</b></p>${lineChart(bk.pts.map(p => ({ l: p.l, v: p.pa })), '%', 'var(--gold)')}
    <p class="small" style="margin:10px 0 2px"><b>Tempo per risposta esatta</b> (più basso = più sicura)</p>${lineChart(bk.pts.map(p => ({ l: p.l, v: p.t })), ' s', 'var(--a)')}</div>
  <div class="card"><h3>Per gioco <small>tocca una riga per il dettaglio</small></h3><div style="overflow-x:auto"><table class="tbl"><tr><th>Gioco</th><th>Svolti</th><th>Esatte</th><th>Aiuto</th><th>Tempo</th><th>Trend 30 gg</th></tr>${tbl}</table></div></div>
  ${rev ? `<div class="card"><h3>Da rivedere <small>ultimi esercizi sbagliati o con aiuto</small></h3>${rev}</div>` : ''}
  ${sess ? `<div class="card"><h3>Ultime sezioni</h3>${sess}</div>` : ''}
  ${Object.keys(IMPORTS).length ? `<p class="note">📥 Le statistiche comprendono i dati di ${Object.keys(IMPORTS).length} altro/i dispositivo/i importati (ultimo aggiornamento importato: ${fmtD(Object.values(IMPORTS).map(x => x.dati.aggiornato).sort().pop())}).</p>` : ''}
  <p class="note">Esatte = giuste senza aiuto. Il tempo conta solo le risposte esatte (al massimo 2 minuti a esercizio) e cambia molto da un gioco all’altro: per valutare i progressi confronta lo stesso gioco nel tempo. L’andamento nel tempo si registra dalla versione 1.5.</p>`
  : `<div class="card"><p class="q">${month ? 'Negli ultimi 30 giorni non ci sono ancora esercizi svolti.' : 'Ancora nessun esercizio svolto.'} Gioca una sezione e qui vedrai i risultati! ⭐</p></div>
  <div class="card"><h3>Per gioco</h3><div style="overflow-x:auto"><table class="tbl"><tr><th>Gioco</th><th>Svolti</th><th>Esatte</th><th>Aiuto</th><th>Tempo</th><th>Trend 30 gg</th></tr>${tbl}</table></div></div>`}
  <div class="rst"><button onclick="askReset()">🔒 Azzera statistiche</button></div>`;
}

// Azzeramento protetto da password (la password si imposta in js/config.js)
function askReset() {
  const m = document.createElement('div'); m.className = 'modal'; m.id = 'modal';
  m.innerHTML = `<div class="mbox"><h3>🔒 Azzera statistiche</h3><p class="sub small" style="text-align:left">Cancella tutti i risultati salvati su questo dispositivo, anche quelli del mese e quelli importati da altri dispositivi. Inserisci la password per continuare.</p>
  <input type="password" id="pw" autocomplete="off" placeholder="Password"><div class="msg" id="pmsg" style="min-height:26px;font-size:.95rem"></div>
  <div class="mbtns"><button onclick="closeModal()">Annulla</button><button class="danger" onclick="doReset()">Azzera</button></div></div>`;
  document.body.appendChild(m);
  const i = $('#pw'); i.focus(); i.addEventListener('keydown', e => { if (e.key === 'Enter') doReset(); });
}
function closeModal() { const m = $('#modal'); if (m) m.remove(); }
async function doReset() {
  const ok = await checkPassword($('#pw').value), p = $('#pmsg');
  if (ok === null) { p.textContent = 'Serve una connessione sicura (https) per verificare la password.'; p.className = 'msg no'; }
  else if (!ok) { p.textContent = 'Password errata'; p.className = 'msg no'; $('#pw').select(); }
  else { resetStats(); statGame = null; closeModal(); statsScreen(); }
}
