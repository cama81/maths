// Flusso dell'app: menu, sezioni da 10 esercizi, aiuto, riepilogo
const CFG = { perSezione: 10, mixPerFunzione: 5 }; // modificabili
let stars = 0, mode = null, S = null, q = null, cur = 0, buf = '', tries = 0, errs = 0, helped = false, locked = false, t0 = 0,
  abN = 0, abU = 0, hp = null, placed = [], bank = [], updatePending = false, installEvt = null;

const PRAISE = ['Bravissima! 🎉', 'Perfetta! ⭐', 'Sei una campionessa! 🏆', 'Che brava! 👏', 'Ottimo lavoro! 🌟'];
const HELPED = ['Brava, ce l’hai fatta! 💪', 'Ben fatto! La prossima volta ci riesci da sola! 🌈'];

const pool = m => DB.filter(x => x.mode === m);

async function init() {
  $('#app').innerHTML = '<p class="sub" style="padding:30px">Caricamento…</p>';
  try { await loadDB(); home(); }
  catch (e) {
    $('#app').innerHTML = `<h1>Ops…</h1><p class="sub">Non riesco a caricare gli esercizi (data/db.json).<br>Se hai aperto il file dal computer, usa l’indirizzo del sito (GitHub Pages) o un server locale.</p><div class="tools"><button onclick="init()">Riprova</button></div>`;
  }
}

function home(report) {
  if (updatePending) return location.reload(); // nuova versione pronta
  mode = null; S = null;
  $('#app').innerHTML = `<div class="hdr"><div class="hbtns"><button class="ic" onclick="statsScreen()" aria-label="Statistiche" title="Statistiche">📊</button><button class="ic" id="mbtn" onclick="toggleMenu()" aria-label="Menu" title="Menu">⋮</button></div>
  <div class="dd" id="dd" hidden>
    <button onclick="menuAct('imp')">⬆ Importa esercizi</button>
    <button onclick="menuAct('exp')">📊 Esporta statistiche</button>
    ${installEvt ? '<button onclick="menuAct(\'inst\')">📲 Installa app</button>' : ''}
    ${DB_IMPORTED ? '<button onclick="menuAct(\'reset\')">↩ Ripristina esercizi originali</button>' : ''}
    <div class="ddinfo">Esercizi in uso: ${DB.length}${DB_IMPORTED ? ' (importati)' : ''}<br>Versione ${APP_VERSION}<br>Autore: Luigi Antonucci</div>
  </div></div>
  <h1><span>👑</span> <span class="g">Matematica in gioco</span> <span>✨</span></h1><p class="sub">Scegli un gioco! Ogni sezione ha ${CFG.perSezione} esercizi</p>
  <div class="menu">${Object.entries(MODES).map(([k, m]) => `<button style="--c:${m.c}" onclick="start('${k}')" ${pool(k).length ? '' : 'disabled'}><span>${m.icon}</span>${m.name}</button>`).join('')}
  <button class="mix" onclick="start('mix')"><span>🎲</span>Mix di tutto (${CFG.mixPerFunzione} per gioco)</button></div>
  <div class="report" id="rep"></div>`;
  if (report) {
    const r = $('#rep'), errors = report.errors || [];
    r.className = 'report ' + (errors.length ? 'err' : 'ok');
    r.innerHTML = (report.msg || (report.added ? `Importati ${report.added} esercizi: ora sostituiscono quelli di db.json su questo dispositivo.` : 'Nessun esercizio importato.')) +
      (errors.length ? `<ul>${errors.slice(0, 6).map(e => `<li>${e}</li>`).join('')}</ul>` : '');
  }
}
function toggleMenu() { const d = $('#dd'); if (d) d.hidden = !d.hidden; }
document.addEventListener('click', e => { const d = $('#dd'); if (d && !d.hidden && !e.target.closest('#dd,#mbtn')) d.hidden = true; });
function menuAct(a) {
  const d = $('#dd'); if (d) d.hidden = true;
  if (a === 'imp') $('#file').click();
  else if (a === 'exp') exportStats();
  else if (a === 'inst') installApp();
  else if (a === 'reset') resetDB().then(() => home({ msg: 'Esercizi originali (data/db.json) ripristinati.' }));
}

// ---- Schermata statistiche ----
function statsScreen() {
  mode = 'stats';
  const t = STATS.totale, pct = (a, b) => b ? Math.round(a / b * 100) + '%' : '–';
  const name = k => k === 'mix' ? '🎲 Mix' : MODES[k] ? `${MODES[k].icon} ${MODES[k].name}` : k;
  const rows = Object.entries(MODES).map(([k, m]) => { const s = STATS.perTipo[k] || zero();
    return `<tr><td>${m.icon} ${m.name}</td><td>${s.svolti}</td><td>${pct(s.esatte, s.svolti)}</td><td>${s.erroriTotali}</td><td>${s.maxConsecutiveEsatte}</td></tr>`; }).join('');
  const sess = STATS.sessioni.slice(-8).reverse().map(s => `<div class="sess"><span>${name(s.sezione)}<br><small>${new Date(s.data).toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</small></span><span>${s.esatte} ✓ · ${s.conAiuto} 💡 · ${s.errate} ✗<br><small>su ${s.totale}</small></span></div>`).join('');
  $('#app').innerHTML = `<div class="top"><button onclick="home()">← Menu</button><h2 class="ttl">📊 Statistiche</h2><span style="width:70px"></span></div>
  ${t.svolti ? `<div class="card"><div class="grid3">
    <div><b>${t.svolti}</b>esercizi svolti</div><div><b>${pct(t.esatte, t.svolti)}</b>esatte</div><div><b>${t.maxConsecutiveEsatte}</b>record di fila</div>
    <div><b>${t.esatte}</b>esatte</div><div><b>${t.conAiuto}</b>con aiuto</div><div><b>${t.errate}</b>sbagliate</div>
    <div><b>${t.erroriTotali}</b>errori totali</div><div><b>${Math.round(t.tempoTotaleSec / t.svolti)}s</b>tempo medio</div><div><b>${t.consecutiveEsatte}</b>esatte di fila ora</div></div></div>
  <div class="card"><h3>Per gioco</h3><div style="overflow-x:auto"><table class="tbl"><tr><th>Gioco</th><th>Svolti</th><th>Esatte</th><th>Errori</th><th>Record</th></tr>${rows}</table></div></div>
  ${sess ? `<div class="card"><h3>Ultime sezioni</h3>${sess}</div>` : ''}`
  : '<div class="card"><p class="q">Ancora nessun esercizio svolto. Gioca una sezione e qui vedrai i risultati! ⭐</p></div>'}`;
}

$('#file').addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; if (f) importFile(f, home); });

function start(m) {
  mode = m;
  const list = m === 'mix' ? shuffle(Object.keys(MODES).flatMap(k => sample(pool(k), CFG.mixPerFunzione))) : sample(pool(m), CFG.perSezione);
  if (!list.length) return home();
  S = { list, i: 0, esatte: 0, aiuto: 0, errate: 0, res: [] };
  show();
}

function show() {
  locked = false; cur = 0; buf = ''; tries = 0; errs = 0; helped = false; hp = null; t0 = Date.now();
  q = JSON.parse(JSON.stringify(S.list[S.i]));
  const hb = '<button class="help-btn" id="hb" onclick="askHelp()">💡 Aiuto</button>', ms = '<div class="msg" id="msg"></div><div id="help"></div>';
  if (q.kind === 'fill') {
    shell(`<p class="q">${q.title}</p>${q.abaco !== undefined ? abSVG(Math.floor(q.abaco / 10), q.abaco % 10) : ''}<div class="row">${cellsHTML(q)}</div>${ms}${hb}${padHTML()}`);
    hl();
  } else if (q.kind === 'cmp') {
    shell(`<p class="q">Quale segno va tra i due numeri?</p><div class="row"><div class="n">${q.a}</div><div class="slot" style="min-width:48px">?</div><div class="n">${q.b}</div></div>
    <div class="choices">${['<', '=', '>'].map((s, i) => `<button class="big" id="c${i}" onclick="cmpPick('${s}')">${['&lt;', '=', '&gt;'][i]}</button>`).join('')}</div>
    <p class="sub small">&lt; minore &nbsp; = uguale &nbsp; &gt; maggiore</p>${ms}${hb}`);
  } else if (q.kind === 'pick') {
    shell(`<p class="q">Qual è il numero ${q.ask === 'min' ? 'PIÙ PICCOLO' : 'PIÙ GRANDE'}?</p><div class="row picks">${q.nums.map((n, i) => `<button class="pk" id="pk${i}" onclick="pickNum(${i})">${n}</button>`).join('')}</div>${ms}${hb}`);
  } else if (q.kind === 'order') {
    const asc = ordTarget('cresc'), desc = ordTarget('decr'), same = (a, b) => a.join() === b.join();
    bank = shuffle(q.nums); for (let t = 0; t < 10 && (same(bank, asc) || same(bank, desc)); t++) bank = shuffle(q.nums);
    placed = q.nums.map(() => -1);
    shell(`<p class="q">${q.dir === 'cresc' ? 'Ordine CRESCENTE: dal più piccolo al più grande' : 'Ordine DECRESCENTE: dal più grande al più piccolo'}</p><div id="ord">${ordHTML()}</div>${ms}${hb}`);
  } else {
    abN = 0; abU = 0;
    shell(`<p class="q">Costruisci il numero ${q.v} sull’abaco</p>${abSVG(0, 0)}
    <div class="ctl"><div><button onclick="abAdj('n',-1)">−</button><b>Decine</b><button onclick="abAdj('n',1)">+</button></div><div><button onclick="abAdj('u',-1)">−</button><b>Unità</b><button onclick="abAdj('u',1)">+</button></div></div>
    ${ms}<button class="big go" style="display:block;margin:0 auto" onclick="abCheck()">Controlla</button>${hb}`);
  }
}

function say(t, c) { const m = $('#msg'); if (m) { m.textContent = t; m.className = 'msg ' + c; } }
function nextBtn() { if ($('.next')) return; const b = document.createElement('button'); b.className = 'big next'; b.textContent = 'Avanti →'; b.onclick = advance; $('.card').appendChild(b); }
function advance() { if (!S || mode === null) return; S.i++; if (S.i >= S.list.length) summary(); else show(); }

// Chiude l'esercizio: esito 'esatta' | 'aiuto' | 'errata'
function finish(esito) {
  locked = true;
  recordResult(q.mode, { esito, errori: errs, aiuto: helped, ms: Date.now() - t0 });
  S.res.push(esito);
  if (esito === 'esatta') { S.esatte++; stars++; } else if (esito === 'aiuto') S.aiuto++; else S.errate++;
  $('.stars').textContent = '⭐ ' + stars;
  if (esito === 'errata') nextBtn();
  else { say(pick(esito === 'esatta' ? PRAISE : HELPED), 'ok'); const s = S; setTimeout(() => { if (S === s) advance(); }, 1300); }
}
const solved = () => finish(helped ? 'aiuto' : 'esatta');

// ---- Esercizi con caselle da riempire (serie, salti, prima/dopo, abaco "leggi") ----
function hl() { document.querySelectorAll('.slot').forEach((s, i) => s.classList.toggle('act', i === cur && !s.classList.contains('done'))); }
function key(k) {
  if (locked) return;
  if (k === 'x') buf = buf.slice(0, -1); else if (buf.length < 3) buf += k;
  const s = $('#s' + cur); if (s) s.textContent = buf;
}
function revealFrom(k) { for (let i = k; i < q.ans.length; i++) { const s = $('#s' + i); s.textContent = q.ans[i]; s.classList.add('done'); } }
function check() {
  if (locked || buf === '') return;
  const s = $('#s' + cur);
  if (+buf === q.ans[cur]) {
    s.classList.add('done'); tries = 0; buf = ''; cur++;
    if (cur >= q.ans.length) solved(); else { say('Giusto! Continua', 'ok'); hl(); }
  } else {
    errs++; tries++; s.classList.add('shake'); setTimeout(() => s.classList.remove('shake'), 300);
    if (tries >= 2) { revealFrom(cur); say('Ecco la risposta giusta. Andiamo avanti!', 'no'); finish('errata'); }
    else { say('Riprova, ce la puoi fare!', 'no'); buf = ''; s.textContent = ''; }
  }
}

// ---- Segni < = > ----
function cmpPick(s) {
  if (locked) return;
  const r = q.a < q.b ? '<' : q.a > q.b ? '>' : '=';
  if (s === r) return solved();
  errs++; tries++; const b = $('#c' + '<=>'.indexOf(s)); b.disabled = true; b.classList.add('wrong');
  if (tries >= 2) { say('Il segno giusto era ' + r, 'no'); finish('errata'); } else say('Riprova! Quale numero è più grande?', 'no');
}

// ---- Il più piccolo / il più grande ----
const pkRight = () => q.nums.indexOf(q.ask === 'min' ? Math.min(...q.nums) : Math.max(...q.nums));
function pickNum(i) {
  if (locked) return;
  if (i === pkRight()) return solved();
  errs++; tries++; const b = $('#pk' + i); b.disabled = true; b.classList.add('wrong');
  if (tries >= 2) { say('Era il ' + q.nums[pkRight()], 'no'); finish('errata'); } else say('Riprova! Confronta bene i numeri', 'no');
}

// ---- Metti in ordine ----
const ordTarget = d => (q ? q.nums : []).slice().sort((a, b) => d === 'cresc' ? a - b : b - a);
function ordHTML() {
  return `<div class="row">${placed.map((b, i) => `<button class="slot ${b >= 0 ? 'filled' : ''}" onclick="ordTake(${i})">${b >= 0 ? bank[b] : ''}</button>`).join('')}</div>
  <p class="sub small">${q.dir === 'cresc' ? 'più piccolo ➜ più grande' : 'più grande ➜ più piccolo'} · tocca una casella per toglierla</p>
  <div class="row picks">${bank.map((n, i) => `<button class="n pickbtn" ${placed.includes(i) ? 'disabled' : ''} onclick="ordPut(${i})">${n}</button>`).join('')}</div>
  <button class="big go" style="display:block;margin:8px auto" onclick="ordCheck()">Controlla</button>`;
}
const ordRender = () => { $('#ord').innerHTML = ordHTML(); };
function ordPut(i) { if (locked) return; const k = placed.indexOf(-1); if (k < 0) return; placed[k] = i; ordRender(); }
function ordTake(k) { if (locked) return; placed[k] = -1; ordRender(); }
function ordFill(target) { const used = new Set(); placed = target.map(v => { const i = bank.findIndex((b, j) => b === v && !used.has(j)); used.add(i); return i; }); ordRender(); }
function ordCheck() {
  if (locked) return;
  if (placed.includes(-1)) return say('Metti tutti i numeri nelle caselle', 'no');
  const t = ordTarget(q.dir);
  if (placed.map(b => bank[b]).join() === t.join()) return solved();
  errs++; tries++;
  if (tries >= 2) { ordFill(t); say('Ecco l’ordine giusto. Andiamo avanti!', 'no'); finish('errata'); }
  else say('Quasi! Guarda bene da quale numero si parte', 'no');
}

// ---- Abaco "costruisci" ----
function abAdj(w, d) {
  if (locked) return;
  if (w === 'n') abN = Math.max(0, Math.min(9, abN + d)); else abU = Math.max(0, Math.min(9, abU + d));
  $('#abw').outerHTML = abSVG(abN, abU);
}
function abCheck() {
  if (locked) return;
  if (abN * 10 + abU === q.v) return solved();
  errs++; tries++;
  if (tries >= 2) { abN = Math.floor(q.v / 10); abU = q.v % 10; $('#abw').outerHTML = abSVG(abN, abU); say(`Servono ${abN} decine e ${abU} unità`, 'no'); finish('errata'); }
  else say('Quasi! Conta ancora le perline', 'no');
}

// ---- Pulsante Aiuto: mostra alcune soluzioni tra cui scegliere ----
function showHelp(opts, onRight) {
  hp = { opts, onRight };
  $('#help').innerHTML = `<p class="sub small">Scegli la risposta giusta:</p><div class="opts">${opts.map((o, i) => `<button class="opt" id="o${i}" onclick="helpPick(${i})">${o.label}</button>`).join('')}</div>`;
}
function helpPick(i) {
  if (locked) return;
  if (hp.opts[i].ok) return hp.onRight();
  errs++; const b = $('#o' + i); b.disabled = true; b.classList.add('wrong'); say('Non è questa, prova un’altra!', 'no');
}
function hideSomeWrong(prefix, n, rightIdx, keepOne) {
  const wrong = [...Array(n).keys()].filter(i => i !== rightIdx && !$('#' + prefix + i).disabled);
  const keep = keepOne ? pick(wrong) : -1;
  wrong.filter(i => i !== keep).forEach(i => { $('#' + prefix + i).style.visibility = 'hidden'; });
  say('Ora scegli tra questi!', 'ok');
}
function askHelp() {
  if (locked || helped) return;
  helped = true; $('#hb').disabled = true;
  if (q.kind === 'fill') {
    showHelp(fillOptions(q.ans.slice(cur)).map(o => ({ label: o.v.join(' · '), ok: o.ok })), () => { revealFrom(cur); finish('aiuto'); });
  } else if (q.kind === 'order') {
    showHelp(orderOptions(ordTarget(q.dir)).map(o => ({ label: o.v.join(' · '), ok: o.ok })), () => { ordFill(ordTarget(q.dir)); finish('aiuto'); });
  } else if (q.kind === 'build') {
    showHelp(buildOptions(q.v).map(o => ({ label: `${o.d} decine e ${o.u} unità`, ok: o.ok, d: o.d, u: o.u })), () => { abN = Math.floor(q.v / 10); abU = q.v % 10; $('#abw').outerHTML = abSVG(abN, abU); finish('aiuto'); });
  } else if (q.kind === 'cmp') {
    const r = q.a < q.b ? '<' : q.a > q.b ? '>' : '='; hideSomeWrong('c', 3, '<=>'.indexOf(r), false);
  } else if (q.kind === 'pick') {
    hideSomeWrong('pk', q.nums.length, pkRight(), true);
  }
}

// ---- Riepilogo di fine sezione ----
function summary() {
  const n = S.list.length, sc = (S.esatte + S.aiuto * .5) / n;
  recordSession({ sezione: mode, totale: n, esatte: S.esatte, conAiuto: S.aiuto, errate: S.errate });
  const msg = sc >= .9 ? 'Sei stata fantastica! Una vera campionessa dei numeri! 🏆'
    : sc >= .7 ? 'Bravissima! Hai lavorato benissimo, continua così! 🌟'
    : sc >= .5 ? 'Brava! Stai facendo grandi progressi: ancora un po’ di allenamento e sarai fortissima! 💪'
    : 'Non ti preoccupare, sbagliando si impara! Riprova, sono sicura che andrà meglio! 🌈';
  $('#app').innerHTML = `<h1>${mode === 'mix' ? 'Mix finito!' : 'Sezione finita!'}</h1><div class="card sum">
  <div class="dots">${S.res.map(r => `<span class="dot ${r}">${r === 'esatta' ? '✓' : r === 'aiuto' ? '💡' : '✗'}</span>`).join('')}</div>
  <div class="tot"><div><b class="g">${S.esatte}</b>esatte</div><div><b class="y">${S.aiuto}</b>con aiuto</div><div><b class="r">${S.errate}</b>sbagliate</div></div>
  <p class="q">${msg}</p><button class="big go" onclick="start('${mode}')">Ancora!</button><button class="big next" style="margin-top:10px" onclick="home()">Menu</button></div>`;
}

init();
