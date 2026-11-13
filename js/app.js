// Flusso dell'app: menu, sezioni da 10 esercizi, aiuto, riepilogo
let mode = null, S = null, q = null, cur = 0, buf = '', tries = 0, errs = 0, helped = false, locked = false, t0 = 0,
  abN = 0, abU = 0, hp = null, placed = [], bank = [], updatePending = false, installEvt = null, statView = 'sempre', okRun = 0;

const BRAVA = ['Brava!', 'Brava!', 'Che brava!', 'Bravissima!'];
const PRAISE = ['Bravissima! 🎉', 'Perfetta! ⭐', 'Sei una campionessa! 🏆', 'Che brava! 👏', 'Ottimo lavoro! 🌟'];
const HELPED = ['Brava, ce l’hai fatta! 💪', 'Ben fatto! La prossima volta ci riesci da sola! 🌈'];

const pool = m => DB.filter(x => x.mode === m);

// Collezione premi (resta sul dispositivo e NON si azzera con le statistiche):
//  stelle = una ⭐ per ogni sezione (o Mix) finita fino in fondo · trofei = un 🏆 per ogni sezione finita con almeno CFG.trofeoDa %
// Al primo avvio parte da quanto già fatto (sezioni registrate nelle statistiche).
const PREMI_V = 2; // v2: stelle = sezioni finite (prima erano le risposte esatte)
// PREMI = premi vinti su questo dispositivo (con un id fisso, che non cambia azzerando le statistiche);
// PREMI_IMP = premi importati da altri dispositivi (un'istantanea per dispositivo, come le statistiche) -> il totale è la somma.
const PRIZE_KEY = 'matematica2.premi', PRIZE_IMP_KEY = 'matematica2.premi.importati';
const sezScore = x => (x.esatte + (x.conAiuto || 0) * .5) / x.totale;
let PREMI = (() => { try { const p = JSON.parse(localStorage.getItem(PRIZE_KEY)); if (p && typeof p.stelle === 'number') return p; } catch (e) {}
  return { trofei: OWN.sessioni.filter(x => !x.interrotta && x.totale && sezScore(x) * 100 >= CFG.trofeoDa).length }; })();
let PREMI_IMP = (() => { try { return JSON.parse(localStorage.getItem(PRIZE_IMP_KEY)) || {}; } catch (e) { return {}; } })();
if (PREMI.v !== PREMI_V) { // passaggio alle nuove stelle: una per ogni sezione già finita; i premi importati con le vecchie stelle si rimportano
  PREMI.stelle = OWN.sessioni.filter(x => !x.interrotta).length; PREMI.v = PREMI_V; PREMI_IMP = {};
}
if (!PREMI.id) PREMI.id = 'p-' + new Date().toISOString() + '-' + Math.random().toString(36).slice(2, 6);
if (typeof PREMI.trofei !== 'number') PREMI.trofei = 0;
const savePremi = () => { PREMI.aggiornato = new Date().toISOString(); try { localStorage.setItem(PRIZE_KEY, JSON.stringify(PREMI)); localStorage.setItem(PRIZE_IMP_KEY, JSON.stringify(PREMI_IMP)); } catch (e) {} };
const totPremi = k => PREMI[k] + Object.values(PREMI_IMP).reduce((s, x) => s + (x[k] || 0), 0);
savePremi();

// ---- Esporta / importa dati: statistiche + premi + impostazioni (giochi nascosti, suoni, esercizi importati) ----
function exportData() {
  const p = buildPackage(); // statistiche (questo dispositivo + quelli già importati)
  p.formato = 'matematica-dati';
  p.premi = { [PREMI.id]: { stelle: PREMI.stelle, trofei: PREMI.trofei, aggiornato: PREMI.aggiornato, v: PREMI_V } };
  Object.entries(PREMI_IMP).forEach(([id, x]) => { p.premi[id] = x; });
  let es = null; try { es = JSON.parse(localStorage.getItem(LS_KEY)); } catch (e) {}
  p.impostazioni = { nascosti: HIDDEN, suoni: SOUND_ON, esercizi: Array.isArray(es) ? es : null };
  download('matematica-dati.json', JSON.stringify(p, null, 2));
}
function applyData(pkg) {
  const r = applyStatsPackage(pkg), parts = [r.fonti.length ? statsMessage(r) : 'Nessuna statistica nel file.'];
  // premi: per ogni dispositivo si tiene l'istantanea più recente, quindi reimportare non li raddoppia
  if (pkg && pkg.premi && typeof pkg.premi === 'object') {
    let n = 0;
    Object.entries(pkg.premi).forEach(([id, x]) => {
      if (id === PREMI.id || !x || typeof x.stelle !== 'number' || x.v !== PREMI_V) return; // i file con le vecchie stelle (una per risposta) si ignorano
      const old = PREMI_IMP[id];
      if (!old || String(x.aggiornato) > String(old.aggiornato)) { PREMI_IMP[id] = { stelle: x.stelle, trofei: x.trofei || 0, aggiornato: x.aggiornato, v: PREMI_V }; n++; }
    });
    savePremi(); stars = totPremi('stelle');
    parts.push(n ? `Premi aggiornati: ora la collezione è di ${totPremi('stelle')} ⭐ e ${totPremi('trofei')} 🏆.` : 'Premi già presenti, nessuna modifica.');
  }
  // impostazioni: vengono prese dal file
  const imp = pkg && pkg.impostazioni;
  if (imp && typeof imp === 'object') {
    if (Array.isArray(imp.nascosti)) { HIDDEN = imp.nascosti.filter(k => MODES[k]); try { localStorage.setItem(HID_KEY, JSON.stringify(HIDDEN)); } catch (e) {} }
    if (typeof imp.suoni === 'boolean') setSound(imp.suoni);
    if (Array.isArray(imp.esercizi)) { const { db, raw } = buildDB(imp.esercizi); if (db.length) { DB = db; DB_IMPORTED = true; try { localStorage.setItem(LS_KEY, JSON.stringify(raw)); } catch (e) {} } }
    parts.push('Impostazioni applicate (giochi nascosti, suoni' + (Array.isArray(imp.esercizi) ? ', esercizi importati' : '') + ').');
  }
  return { msg: parts.join(' '), errors: r.fonti.length ? r.errors : [] };
}
function importDataFile(file, done) {
  const rd = new FileReader();
  rd.onload = () => { let d; try { d = JSON.parse(rd.result); } catch (e) { return done({ msg: 'Nessun dato importato.', errors: ['File JSON non valido: ' + e.message] }); } done(applyData(d)); };
  rd.onerror = () => done({ msg: 'Nessun dato importato.', errors: ['Impossibile leggere il file'] });
  rd.readAsText(file);
}
let stars = totPremi('stelle');

// Giochi nascosti (le versioni difficili all'inizio); si riattivano da ⋮, la scelta resta salvata sul dispositivo
const HID_KEY = 'matematica2.nascosti';
let HIDDEN = (() => { try { const h = JSON.parse(localStorage.getItem(HID_KEY)); if (Array.isArray(h)) return h; } catch (e) {} return CFG.nascostiDefault.slice(); })();
const visibleModes = () => Object.keys(MODES).filter(k => !HIDDEN.includes(k));
function toggleHidden(k) { HIDDEN = HIDDEN.includes(k) ? HIDDEN.filter(x => x !== k) : HIDDEN.concat(k); try { localStorage.setItem(HID_KEY, JSON.stringify(HIDDEN)); } catch (e) {} }

// Segnalini sui pulsanti dei giochi: ⭐ se va benissimo, ⚠️ se è trascurato da settimane o ha troppi errori
function lastDay(k) { let m = ''; for (const [d, g] of Object.entries(STATS.giorni)) { const s = g.perTipo[k]; if (s && s.svolti && d > m) m = d; } return m; }
function badge(k) {
  const o30 = last30(k), o = o30.svolti >= CFG.minEsercizi ? o30 : allTime(k), out = [];
  if (!o.svolti) return null;
  const ok = o.esatte / o.svolti * 100, ko = o.errate / o.svolti * 100, ld = lastDay(k);
  const giorni = ld ? Math.floor((new Date(dayKey()) - new Date(ld)) / 864e5) : 0;
  if (o.svolti >= CFG.minEsercizi && ok > CFG.stellaOltre) out.push(['⭐', `${Math.round(ok)}% esatte`]);
  if (ld && giorni >= CFG.attenzioneGiorni) out.push(['⚠️', `non lo fai da ${Math.floor(giorni / 7)} settimane`]);
  else if (o.svolti >= CFG.minEsercizi && ko > CFG.attenzioneErrori) out.push(['⚠️', `${Math.round(ko)}% sbagliate`]);
  return out.length ? out : null;
}

async function init() {
  $('#app').innerHTML = '<p class="sub" style="padding:30px">Caricamento…</p>';
  try { await loadDB(); home(); }
  catch (e) {
    $('#app').innerHTML = `<h1>Ops…</h1><p class="sub">Non riesco a caricare gli esercizi (data/db.json).<br>Se hai aperto il file dal computer, usa l’indirizzo del sito (GitHub Pages) o un server locale.</p><div class="tools"><button onclick="init()">Riprova</button></div>`;
  }
}

function home(report) {
  if (updatePending) return location.reload(); // nuova versione pronta
  mode = null; S = null; stopVoice();
  $('#app').innerHTML = `<div class="hdr"><h1><span>👑</span> <span class="g">Matematica in gioco</span></h1>
  <div class="hbtns"><button class="ic" onclick="statsScreen()" aria-label="Statistiche" title="Statistiche">📊</button><button class="ic" id="mbtn" onclick="toggleMenu()" aria-label="Menu" title="Menu">⋮</button></div>
  <div class="dd" id="dd" hidden>
    <button onclick="menuAct('imp')">⬆ Importa esercizi</button>
    <button onclick="menuAct('snd')">${SOUND_ON ? '🔊 Suoni e voce: attivi' : '🔇 Suoni e voce: spenti'}</button>
    <button onclick="menuAct('exp')">📤 Esporta dati</button>
    <button onclick="menuAct('simp')">📥 Importa dati</button>
    ${CFG.nascostiDefault.concat(HIDDEN.filter(k => !CFG.nascostiDefault.includes(k))).filter(k => MODES[k]).map(k => `<button onclick="menuAct('hid:${k}')">${HIDDEN.includes(k) ? '🙈' : '👁'} ${MODES[k].name}: ${HIDDEN.includes(k) ? 'nascosto' : 'visibile'}</button>`).join('')}
    ${installEvt ? '<button onclick="menuAct(\'inst\')">📲 Installa app</button>' : ''}
    ${DB_IMPORTED ? '<button onclick="menuAct(\'reset\')">↩ Ripristina esercizi originali</button>' : ''}
    <div class="ddinfo">Esercizi in uso: ${DB.length}${DB_IMPORTED ? ' (importati)' : ''}<br>Versione ${APP_VERSION}<br>Autore: Luigi Antonucci</div>
  </div></div>
  <p class="sub">Scegli come giocare ✨</p>
  <div class="coll"><span>Hai collezionato <b>${totPremi('stelle')}</b> ⭐</span><span><b>${totPremi('trofei')}</b> 🏆</span></div>
  <button class="main" onclick="start('mix')"><span class="mt"><i class="dice">🎲</i> Mix di tutto</span><span class="ms">${CFG.mixPerFunzione} esercizi per ogni gioco, tutti mescolati</span></button>
  <div class="sec">Approfondisci un gioco · ${CFG.perSezione} esercizi</div>
  <div class="menu">${visibleModes().map(k => { const m = MODES[k], b = badge(k);
    return `<button style="--c:rgb(${m.c});--rgb:${m.c}" onclick="start('${k}')" ${pool(k).length ? '' : 'disabled'}${b ? ` title="${b.map(x => x[1]).join(' · ')}"` : ''}><i>${m.icon}</i><span class="nm">${m.name}</span>${b ? `<span class="bdg">${b.map(x => x[0]).join('')}</span>` : ''}</button>`; }).join('')}</div>
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
  else if (a === 'snd') { setSound(!SOUND_ON); if (SOUND_ON) speak('Brava!'); home(); }
  else if (a === 'exp') exportData();
  else if (a === 'simp') $('#sfile').click();
  else if (a === 'inst') installApp();
  else if (a.startsWith('hid:')) { toggleHidden(a.slice(4)); home(); }
  else if (a === 'reset') resetDB().then(() => home({ msg: 'Esercizi originali (data/db.json) ripristinati.' }));
}

$('#sfile').addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; if (f) importDataFile(f, home); });
$('#file').addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; if (f) importFile(f, home); });

function start(m) {
  mode = m;
  const list = m === 'mix' ? shuffle(visibleModes().filter(k => !CFG.esclusiDalMix.includes(k)).flatMap(k => sampleUnique(pool(k), CFG.mixPerFunzione))) : sample(pool(m), CFG.perSezione);
  if (!list.length) return home();
  okRun = 0; S = { list, i: 0, esatte: 0, aiuto: 0, errate: 0, res: [] };
  show();
}

function show() {
  locked = false; cur = 0; buf = ''; tries = 0; errs = 0; helped = false; hp = null; t0 = Date.now();
  q = JSON.parse(JSON.stringify(S.list[S.i]));
  const hb = '<button class="help-btn" id="hb" onclick="askHelp()">💡 Aiuto</button>', ms = '<div class="msg" id="msg"></div><div id="help"></div>';
  if (q.kind === 'fill') {
    shell(`<p class="q">${q.title}</p>${q.abaco !== undefined ? abSVG(Math.floor(q.abaco / 10), q.abaco % 10) : ''}${q.col ? colHTML(q) : q.miss ? missHTML(q) : `<div class="row">${cellsHTML(q)}</div>`}${ms}${hb}${padHTML()}`);
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

// "← Menu" in una sezione non finita: gli esercizi già fatti sono già nelle statistiche; si registra anche la sezione come interrotta
function quitSection() {
  if (S && mode && S.list.length && S.res.length >= S.list.length) return summary(); // già tutti fatti: mostra il riepilogo
  if (S && mode && mode !== 'mix' && S.res.length && S.i < S.list.length)
    recordSession({ sezione: mode, totale: S.res.length, esatte: S.esatte, conAiuto: S.aiuto, errate: S.errate, interrotta: true, previsti: S.list.length });
  home();
}
function wrongAns() { errs++; soundWrong(); }
function say(t, c) { const m = $('#msg'); if (m) { m.textContent = t; m.className = 'msg ' + c; } }
function nextBtn() { if ($('.next')) return; const b = document.createElement('button'); b.className = 'big next'; b.textContent = 'Avanti →'; b.onclick = advance; $('.card').appendChild(b); }
function advance() { if (!S || mode === null) return; S.i++; if (S.i >= S.list.length) summary(); else show(); }

// Chiude l'esercizio: esito 'esatta' | 'aiuto' | 'errata'
function finish(esito) {
  locked = true;
  recordResult(q.mode, { esito, errori: errs, aiuto: helped, ms: Date.now() - t0, testo: describeEx(q) });
  S.res.push(esito);
  if (esito === 'esatta') S.esatte++; else if (esito === 'aiuto') S.aiuto++; else S.errate++;
  if (esito === 'errata') { okRun = 0; nextBtn(); }
  else { say(pick(esito === 'esatta' ? PRAISE : HELPED), 'ok'); soundRight(); if (++okRun >= CFG.bravaOgni) { okRun = 0; speak(pick(BRAVA)); } const s = S; setTimeout(() => { if (S === s) advance(); }, 1300); }
}
const solved = () => finish(helped ? 'aiuto' : 'esatta');

// ---- Esercizi con caselle da riempire (serie, salti, prima/dopo, abaco "leggi") ----
function hl() { document.querySelectorAll('.slot').forEach(s => s.classList.toggle('act', s.id === 's' + cur && !s.classList.contains('done'))); }
function key(k) {
  if (locked) return;
  if (k === 'x') buf = buf.slice(0, -1); else if (buf.length < (q.col ? 1 : 3)) buf += k;
  const s = $('#s' + cur); if (s) s.textContent = buf;
}
function revealFrom(k) { for (let i = k; i < q.ans.length; i++) { const s = $('#s' + i); s.textContent = q.ans[i]; s.classList.add('done'); } }
function check() {
  if (locked || buf === '') return;
  const s = $('#s' + cur);
  if (+buf === q.ans[cur]) {
    s.classList.add('done'); tries = 0; buf = ''; cur++;
    if (cur >= q.ans.length) solved(); else { say('Giusto! Continua', 'ok'); soundStep(); hl(); }
  } else {
    wrongAns(); tries++; s.classList.add('shake'); setTimeout(() => s.classList.remove('shake'), 300);
    if (tries >= 2) { revealFrom(cur); say('Ecco la risposta giusta. Andiamo avanti!', 'no'); finish('errata'); }
    else { say('Riprova, ce la puoi fare!', 'no'); buf = ''; s.textContent = ''; }
  }
}

// ---- Segni < = > ----
function cmpPick(s) {
  if (locked) return;
  const r = q.a < q.b ? '<' : q.a > q.b ? '>' : '=';
  if (s === r) return solved();
  wrongAns(); tries++; const b = $('#c' + '<=>'.indexOf(s)); b.disabled = true; b.classList.add('wrong');
  if (tries >= 2) { say('Il segno giusto era ' + r, 'no'); finish('errata'); } else say('Riprova! Quale numero è più grande?', 'no');
}

// ---- Il più piccolo / il più grande ----
const pkRight = () => q.nums.indexOf(q.ask === 'min' ? Math.min(...q.nums) : Math.max(...q.nums));
function pickNum(i) {
  if (locked) return;
  if (i === pkRight()) return solved();
  wrongAns(); tries++; const b = $('#pk' + i); b.disabled = true; b.classList.add('wrong');
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
  wrongAns(); tries++;
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
  wrongAns(); tries++;
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
  wrongAns(); const b = $('#o' + i); b.disabled = true; b.classList.add('wrong'); say('Non è questa, prova un’altra!', 'no');
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
  if (q.col) {
    showHelp(colOptions(q.col.r).map(o => ({ label: o.v, ok: o.ok })), () => { revealFrom(cur); finish('aiuto'); });
  } else if (q.kind === 'fill') {
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
  const trofeo = sc * 100 >= CFG.trofeoDa; PREMI.stelle++; if (trofeo) PREMI.trofei++; savePremi(); stars = totPremi('stelle');
  const lv = sc >= .7 ? 0 : sc >= .4 ? 1 : 2; // 70% e oltre / dal 40% al 70% / sotto il 40%
  const msg = ['Ottimo lavoro! Sei una vera campionessa dei numeri! 🏆', 'Ci siamo quasi! Ancora un piccolo sforzo e sarai perfetta! 💪', 'Puoi fare meglio! Riprova, sono sicura che andrà meglio! 🌈'][lv];
  speak(['Ottimo lavoro!', 'Ci siamo quasi!', 'Puoi fare meglio!'][lv]);
  $('#app').innerHTML = `<h1>${mode === 'mix' ? 'Mix finito!' : 'Sezione finita!'}</h1><div class="card sum">
  <div class="dots">${S.res.map(r => `<span class="dot ${r}">${r === 'esatta' ? '✓' : r === 'aiuto' ? '💡' : '✗'}</span>`).join('')}</div>
  <div class="tot"><div><b class="g">${S.esatte}</b>esatte</div><div><b class="y">${S.aiuto}</b>con aiuto</div><div><b class="r">${S.errate}</b>sbagliate</div></div>
  <div class="trophy"><span>${trofeo ? '⭐🏆' : '⭐'}</span>${trofeo ? 'Hai vinto una stella e un trofeo!' : 'Hai vinto una stella!'}<br><small>Ora hai ${stars} ⭐ e ${totPremi('trofei')} 🏆</small></div>
  ${trofeo ? '' : `<p class="sub small">Con almeno il ${CFG.trofeoDa}% vinci anche un trofeo 🏆</p>`}
  <p class="q">${msg}</p><button class="big go" onclick="start('${mode}')">Ancora!</button><button class="big next" style="margin-top:10px" onclick="home()">Menu</button></div>`;
}

init();
