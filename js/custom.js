// Esercizi personalizzati: validazione, import da file JSON, salvataggio locale, esempio scaricabile
const LS_KEY = 'matematica2.esercizi';
const inR = n => Number.isInteger(n) && n >= 0 && n <= 100;

const EXAMPLE = {
  esercizi: [
    { tipo: 'serie', numeri: [10, 15, null, 25, null, 35] },
    { tipo: 'serie', numeri: [60, null, 50, 45, null], titolo: 'Torna indietro di 5 in 5' },
    { tipo: 'salti', partenza: 34, operazioni: [5, -3, 10] },
    { tipo: 'confronto', a: 45, b: 54 },
    { tipo: 'prima_dopo', numero: 47, chiedi: 'entrambi' },
    { tipo: 'abaco', numero: 37, modalita: 'leggi' },
    { tipo: 'abaco', numero: 62, modalita: 'costruisci' }
  ]
};

function loadCustom() { try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch (e) { return []; } }
function saveCustom(list) { try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch (e) {} }
let CUSTOM = loadCustom(); // elenco di modelli già validati

// Converte una voce del file in un modello; lancia Error con messaggio in italiano se non valida
function parseOne(e) {
  const t = e && e.tipo;
  if (t === 'serie') {
    const n = e.numeri;
    if (!Array.isArray(n) || n.length < 3 || n.length > 10) throw new Error('"numeri" deve avere da 3 a 10 elementi');
    if (n.some(x => x !== null && !inR(x))) throw new Error('i numeri devono essere interi da 0 a 100 (o null)');
    const known = n.map((v, i) => v === null ? -1 : i).filter(i => i >= 0);
    if (known.length < 2 || known.length === n.length) throw new Error('servono almeno 2 numeri noti e almeno un null');
    const [i, j] = known, step = (n[j] - n[i]) / (j - i);
    if (!Number.isInteger(step) || step === 0) throw new Error('non riesco a ricavare un passo regolare');
    const vals = n.map((_, k) => n[i] + step * (k - i));
    if (vals.some(v => !inR(v)) || known.some(k => vals[k] !== n[k])) throw new Error('la serie non è regolare o esce da 0–100');
    const hid = n.map((v, k) => v === null ? k : -1).filter(k => k >= 0);
    const a = Math.abs(step);
    return mkFill('serie', e.titolo || `Completa la serie: si va ${step > 0 ? 'avanti' : 'indietro'} di ${a} in ${a}`, vals, hid, Array(n.length - 1).fill(step));
  }
  if (t === 'salti') {
    const ops = e.operazioni;
    if (!inR(e.partenza) || !Array.isArray(ops) || ops.length < 1 || ops.length > 5 || ops.some(x => !Number.isInteger(x) || x === 0)) throw new Error('servono "partenza" e da 1 a 5 "operazioni" (interi diversi da 0)');
    const vals = [e.partenza]; ops.forEach(d => vals.push(vals[vals.length - 1] + d));
    if (vals.some(v => !inR(v))) throw new Error('i risultati escono da 0–100');
    return mkFill('salti', e.titolo || 'Segui le frecce: fai un calcolo dopo l’altro', vals, vals.map((_, k) => k).slice(1), ops);
  }
  if (t === 'confronto') {
    if (!inR(e.a) || !inR(e.b)) throw new Error('"a" e "b" devono essere interi da 0 a 100');
    return { kind: 'cmp', mode: 'conf', a: e.a, b: e.b };
  }
  if (t === 'prima_dopo') {
    const x = e.numero, ask = e.chiedi || 'entrambi';
    if (!Number.isInteger(x) || x < 1 || x > 99) throw new Error('"numero" deve essere intero da 1 a 99');
    if (!['prima', 'dopo', 'entrambi'].includes(ask)) throw new Error('"chiedi" deve essere prima, dopo o entrambi');
    return pdModel(x, ask);
  }
  if (t === 'abaco') {
    if (!Number.isInteger(e.numero) || e.numero < 0 || e.numero > 99) throw new Error('"numero" deve essere intero da 0 a 99');
    if (e.modalita === 'costruisci') return { kind: 'build', mode: 'abaco', v: e.numero };
    if (e.modalita && e.modalita !== 'leggi') throw new Error('"modalita" deve essere leggi o costruisci');
    return abLeggi(e.numero);
  }
  throw new Error('"tipo" sconosciuto (usa serie, salti, confronto, prima_dopo, abaco)');
}

// Legge un file JSON, aggiunge gli esercizi validi, restituisce il resoconto a callback
function importFile(file, done) {
  const rd = new FileReader();
  rd.onload = () => {
    let data;
    try { data = JSON.parse(rd.result); } catch (e) { return done({ added: 0, errors: ['Il file non è un JSON valido: ' + e.message] }); }
    const list = Array.isArray(data) ? data : data && data.esercizi;
    if (!Array.isArray(list)) return done({ added: 0, errors: ['Manca l’elenco "esercizi"'] });
    const errors = []; let added = 0;
    list.forEach((e, i) => {
      try { CUSTOM.push(parseOne(e)); added++; } catch (err) { errors.push(`Esercizio ${i + 1}: ${err.message}`); }
    });
    saveCustom(CUSTOM);
    done({ added, errors });
  };
  rd.onerror = () => done({ added: 0, errors: ['Impossibile leggere il file'] });
  rd.readAsText(file);
}
function clearCustom() { CUSTOM = []; saveCustom(CUSTOM); }
function downloadExample() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(EXAMPLE, null, 2)], { type: 'application/json' }));
  a.download = 'esempio-esercizi.json'; a.click();
}
