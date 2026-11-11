// Flusso dell'app: menu, scelta esercizio, controllo risposte
let stars = 0, mode = null, q = null, cur = 0, buf = '', tries = 0, locked = false, abN = 0, abU = 0, queue = [];

function home(report) {
  mode = null;
  const n = CUSTOM.length;
  $('#app').innerHTML = `<h1>Matematica in gioco</h1><p class="sub">Scegli un gioco! Numeri da 1 a 100</p>
  <div class="menu">${Object.entries(MODES).map(([k, m]) => `<button onclick="start('${k}')"><span>${m.icon}</span>${m.name}</button>`).join('')}
  <button onclick="start('mine')" ${n ? '' : 'disabled'}><span>📁</span>I miei esercizi (${n})</button></div>
  <div class="tools"><button onclick="$('#file').click()">⬆ Importa esercizi</button><button onclick="downloadExample()">⬇ File di esempio</button>${n ? '<button onclick="clearCustom();home()">🗑 Svuota i miei</button>' : ''}</div>
  <div class="report" id="rep"></div>`;
  if (report && report.errors) {
    const r = $('#rep');
    r.className = 'report ' + (report.errors.length ? 'err' : 'ok');
    r.innerHTML = `${report.added ? `Aggiunti ${report.added} esercizi.` : 'Nessun esercizio aggiunto.'}` +
      (report.errors.length ? `<ul>${report.errors.slice(0, 6).map(e => `<li>${e}</li>`).join('')}</ul>` : '');
  }
}
$('#file').addEventListener('change', e => {
  const f = e.target.files[0]; e.target.value = '';
  if (f) importFile(f, home);
});

function start(m) { mode = m; queue = []; next(); }

function chooseModel() {
  if (mode === 'mine') { if (!queue.length) queue = shuffle(CUSTOM); return queue.pop(); }
  const mine = CUSTOM.filter(x => x.mode === mode);
  // circa 1 esercizio su 3 viene dai tuoi, se ce ne sono per questo gioco
  return mine.length && Math.random() < .35 ? pick(mine) : GEN[mode]();
}

function next() {
  locked = false; cur = 0; buf = ''; tries = 0;
  q = JSON.parse(JSON.stringify(chooseModel()));
  if (q.kind === 'fill') {
    shell(`<p class="q">${q.title}</p>${q.abaco !== undefined ? abSVG(Math.floor(q.abaco / 10), q.abaco % 10) : ''}<div class="row">${cellsHTML(q)}</div><div class="msg" id="msg"></div>${padHTML()}`);
    hl();
  } else if (q.kind === 'cmp') {
    shell(`<p class="q">Quale segno va tra i due numeri?</p><div class="row"><div class="n">${q.a}</div><div class="slot" style="min-width:48px">?</div><div class="n">${q.b}</div></div>
    <div class="choices" style="margin-top:14px">${['<', '=', '>'].map(s => `<button class="big" onclick="cmp('${s}')">${s === '<' ? '&lt;' : s === '>' ? '&gt;' : s}</button>`).join('')}</div>
    <p class="sub" style="margin-top:12px">&lt; minore &nbsp; = uguale &nbsp; &gt; maggiore</p><div class="msg" id="msg"></div>`);
  } else {
    abN = 0; abU = 0;
    shell(`<p class="q">Costruisci il numero ${q.v} sull’abaco</p>${abSVG(0, 0)}
    <div class="ctl"><div><button onclick="abAdj('n',-1)">−</button><b>Decine</b><button onclick="abAdj('n',1)">+</button></div><div><button onclick="abAdj('u',-1)">−</button><b>Unità</b><button onclick="abAdj('u',1)">+</button></div></div>
    <div class="msg" id="msg"></div><button class="big go" style="display:block;margin:0 auto" onclick="abCheck()">Controlla</button>`);
  }
}

function hl() { document.querySelectorAll('.slot').forEach((s, i) => s.classList.toggle('act', i === cur && !s.classList.contains('done'))); }
function key(k) {
  if (locked) return;
  if (k === 'x') buf = buf.slice(0, -1); else if (buf.length < 3) buf += k;
  const s = $('#s' + cur); if (s) s.textContent = buf;
}
function say(t, c) { const m = $('#msg'); m.textContent = t; m.className = 'msg ' + c; }
function check() {
  if (locked || buf === '') return;
  const s = $('#s' + cur);
  if (+buf === q.ans[cur]) {
    s.classList.add('done'); tries = 0; buf = ''; cur++;
    if (cur >= q.ans.length) win(); else { say('Giusto! Continua', 'ok'); hl(); }
  } else {
    tries++; s.classList.add('shake'); setTimeout(() => s.classList.remove('shake'), 300);
    if (tries >= 2) { s.textContent = q.ans[cur]; s.classList.add('done'); locked = true; say('Era ' + q.ans[cur] + '. Proviamo un altro!', 'no'); nextBtn(); }
    else { say('Riprova, ce la puoi fare!', 'no'); buf = ''; s.textContent = ''; }
  }
}
function win() { locked = true; stars++; $('.stars').textContent = '⭐ ' + stars; say(pick(['Bravissimo! 🎉', 'Perfetto! ⭐', 'Grande! 👏', 'Ottimo lavoro! 🌟']), 'ok'); setTimeout(next, 1100); }
function nextBtn() { const b = document.createElement('button'); b.className = 'big next'; b.textContent = 'Avanti →'; b.onclick = next; $('.card').appendChild(b); }
function cmp(s) {
  if (locked) return;
  const r = q.a < q.b ? '<' : q.a > q.b ? '>' : '=';
  if (s === r) win(); else { tries++; if (tries >= 2) { locked = true; say('Il segno giusto era ' + r, 'no'); nextBtn(); } else say('Riprova! Quale numero è più grande?', 'no'); }
}
function abAdj(w, d) {
  if (locked) return;
  if (w === 'n') abN = Math.max(0, Math.min(9, abN + d)); else abU = Math.max(0, Math.min(9, abU + d));
  $('#abw').outerHTML = abSVG(abN, abU);
}
function abCheck() {
  if (locked) return;
  if (abN * 10 + abU === q.v) win();
  else { tries++; if (tries >= 2) { locked = true; say(`Servono ${Math.floor(q.v / 10)} decine e ${q.v % 10} unità`, 'no'); nextBtn(); } else say('Quasi! Conta ancora le perline', 'no'); }
}
home();
