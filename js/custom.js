// Caricamento degli esercizi. L'import da file SOSTITUISCE data/db.json su questo dispositivo (finché non lo ripristini).
const LS_KEY = 'matematica2.db';
let DB = [], DB_IMPORTED = false;
try { localStorage.removeItem('matematica2.esercizi'); } catch (e) {} // vecchia chiave (esercizi aggiunti)

function buildDB(list) {
  const db = [], raw = [], bad = [];
  list.forEach((e, i) => { try { db.push(parseOne(e)); raw.push(e); } catch (x) { bad.push(`Esercizio ${i + 1}: ${x.message}`); } });
  return { db, raw, bad };
}
const readList = j => Array.isArray(j) ? j : j && j.esercizi;

async function loadDB() {
  try {
    const ov = JSON.parse(localStorage.getItem(LS_KEY));
    if (Array.isArray(ov)) { const { db } = buildDB(ov); if (db.length) { DB = db; DB_IMPORTED = true; return; } }
  } catch (e) {}
  const r = await fetch('data/db.json', { cache: 'no-cache' });
  if (!r.ok) throw new Error('db.json: ' + r.status);
  const list = readList(await r.json());
  if (!Array.isArray(list)) throw new Error('db.json: manca "esercizi"');
  const { db, bad } = buildDB(list);
  if (bad.length) console.warn('db.json: esercizi scartati', bad);
  if (!db.length) throw new Error('db.json vuoto');
  DB = db; DB_IMPORTED = false;
}
function importFile(file, done) {
  const rd = new FileReader();
  rd.onload = () => {
    let data; try { data = JSON.parse(rd.result); } catch (e) { return done({ added: 0, errors: ['File JSON non valido: ' + e.message] }); }
    const list = readList(data);
    if (!Array.isArray(list)) return done({ added: 0, errors: ['Manca l’elenco "esercizi"'] });
    const { db, raw, bad } = buildDB(list);
    if (!db.length) return done({ added: 0, errors: bad.length ? bad : ['Nessun esercizio valido nel file'] });
    DB = db; DB_IMPORTED = true; // sostituisce gli esercizi di db.json
    try { localStorage.setItem(LS_KEY, JSON.stringify(raw)); }
    catch (e) { bad.push('Salvataggio locale non riuscito: gli esercizi valgono solo fino alla chiusura dell’app'); }
    done({ added: db.length, errors: bad });
  };
  rd.onerror = () => done({ added: 0, errors: ['Impossibile leggere il file'] });
  rd.readAsText(file);
}
async function resetDB() { try { localStorage.removeItem(LS_KEY); } catch (e) {} await loadDB(); }
