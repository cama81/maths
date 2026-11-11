// Caricamento di data/db.json (esercizi) ed eventuale import di altri file con lo stesso formato
const LS_KEY = 'matematica2.esercizi';
let DB = [];
const safeParse = e => { try { return parseOne(e); } catch (x) { return null; } };
let CUSTOM_RAW = (() => { try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch (e) { return []; } })();
let CUSTOM = CUSTOM_RAW.map(safeParse).filter(Boolean);
const saveCustom = () => { try { localStorage.setItem(LS_KEY, JSON.stringify(CUSTOM_RAW)); } catch (e) {} };

async function loadDB() {
  const r = await fetch('data/db.json', { cache: 'no-cache' });
  if (!r.ok) throw new Error('db.json: ' + r.status);
  const j = await r.json(), list = Array.isArray(j) ? j : j.esercizi;
  if (!Array.isArray(list)) throw new Error('db.json: manca "esercizi"');
  DB = []; const bad = [];
  list.forEach((e, i) => { try { DB.push(parseOne(e)); } catch (x) { bad.push(`#${i + 1}: ${x.message}`); } });
  if (bad.length) console.warn('db.json: esercizi scartati', bad);
  if (!DB.length) throw new Error('db.json vuoto');
}
function importFile(file, done) {
  const rd = new FileReader();
  rd.onload = () => {
    let data; try { data = JSON.parse(rd.result); } catch (e) { return done({ added: 0, errors: ['File JSON non valido: ' + e.message] }); }
    const list = Array.isArray(data) ? data : data && data.esercizi;
    if (!Array.isArray(list)) return done({ added: 0, errors: ['Manca l’elenco "esercizi"'] });
    const errors = []; let added = 0;
    list.forEach((e, i) => { try { CUSTOM.push(parseOne(e)); CUSTOM_RAW.push(e); added++; } catch (x) { errors.push(`Esercizio ${i + 1}: ${x.message}`); } });
    saveCustom(); done({ added, errors });
  };
  rd.onerror = () => done({ added: 0, errors: ['Impossibile leggere il file'] });
  rd.readAsText(file);
}
function clearCustom() { CUSTOM = []; CUSTOM_RAW = []; saveCustom(); }
