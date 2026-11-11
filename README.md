# Matematica in gioco – 2ª elementare

Va pubblicata su un sito (GitHub Pages) o aperta con un server locale (`python3 -m http.server`), perché legge `data/db.json`.
Aprendo `index.html` con doppio clic l'app mostra un messaggio di errore.

## Struttura
- `index.html`, `manifest.webmanifest`, `sw.js` (app installabile e offline), icone `icon-*.png`
- `css/style.css`
- `js/utils.js` utilità · `js/models.js` tipi di esercizio, controlli e soluzioni dell'aiuto
- `js/stats.js` statistiche · `js/custom.js` caricamento di db.json e import · `js/render.js` disegno · `js/app.js` gioco · `js/pwa.js` installazione/aggiornamenti
- `data/db.json` TUTTI gli esercizi · `data/statistiche.json` modello vuoto delle statistiche
- `tools/genera-db.js` (facoltativo) rigenera un db.json casuale: `node tools/genera-db.js`

## Sezioni
Ogni gioco = 10 esercizi (`CFG.perSezione` in `js/app.js`), poi riepilogo. "Mix di tutto" = 5 esercizi per ogni gioco (`CFG.mixPerFunzione`), mescolati.
Giochi: serie, più e meno, segni < = >, prima e dopo, metti in ordine, il più piccolo/grande, abaco.
Pulsante 💡 Aiuto: mostra alcune soluzioni tra cui scegliere (esercizio contato "con aiuto").

## data/db.json
Per cambiare gli esercizi basta sostituire il file e ripubblicare (poi alza `VERSION` in `sw.js` e `APP_VERSION` in `js/utils.js`). Numeri da 0 a 100.
- serie: `{"tipo":"serie","numeri":[10,15,null,25,null,35]}` (null = da completare, passo ricavato in automatico, anche all'indietro)
- salti: `{"tipo":"salti","partenza":34,"operazioni":[5,-3,10]}`
- confronto: `{"tipo":"confronto","a":45,"b":54}`
- prima_dopo: `{"tipo":"prima_dopo","numero":47}` (chiede sempre precedente e successivo)
- ordina: `{"tipo":"ordina","numeri":[42,7,63,19],"ordine":"crescente|decrescente"}` (3–6 numeri diversi)
- minmax: `{"tipo":"minmax","numeri":[42,7,63],"chiedi":"minore|maggiore"}` (3–6 numeri diversi)
- abaco: `{"tipo":"abaco","numero":37,"modalita":"leggi|costruisci"}`
Le voci non valide vengono scartate (avviso nella console del browser). Lo stesso formato si importa dal menu ⋮ → "Importa esercizi": gli esercizi del file SOSTITUISCONO quelli di db.json su quel dispositivo (restano salvati lì). Mentre un import è attivo, le modifiche a db.json online non si vedono su quel dispositivo: serve ⋮ → "Ripristina esercizi originali".

## Statistiche
Un sito statico non può scrivere nei file del repository: le statistiche sono salvate nel browser del dispositivo, con la struttura di `data/statistiche.json`.
Le statistiche si consultano con l'icona 📊 in alto a destra; dal menu ⋮ → "Esporta statistiche" si scarica il file aggiornato. Per ogni esercizio: esito (esatta / con aiuto / errata), tentativi sbagliati, tempo; più serie di esatte consecutive (totale e per gioco) e le ultime 100 sezioni.

## Aggiornamenti dell'app installata
Online, l'app scarica da sola i file nuovi e si ricarica quando sei nel menu. Dopo ogni modifica cambia `VERSION` in `sw.js` e `APP_VERSION` in `js/utils.js` (il numero mostrato nel menu ⋮, insieme all'autore).
