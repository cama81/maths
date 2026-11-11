# Matematica in gioco – 2ª elementare (v1.7.0)

Va pubblicata su un sito (GitHub Pages) o aperta con un server locale (`python3 -m http.server`), perché legge `data/db.json`.

## Struttura
- `index.html`, `manifest.webmanifest`, `sw.js` (app installabile e offline), icone `icon-*.png` e `favicon-*.png` (usate anche come icona nella scheda del browser)
- `css/style.css` · `img/fiaba.svg` (sfondo fiabesco leggero; `castello.svg` e `stelle.svg` sono presenti ma non usati)
- `js/config.js` impostazioni (esercizi per sezione, mix, password di reset)
- `js/utils.js` utilità e numero versione · `js/models.js` tipi di esercizio, controlli e aiuto
- `js/stats.js` statistiche · `js/custom.js` caricamento/import db · `js/render.js` disegno · `js/app.js` gioco · `js/pwa.js` installazione/aggiornamenti
- `data/db.json` TUTTI gli esercizi · `data/statistiche.json` modello vuoto delle statistiche
- `tools/genera-db.js` rigenera un db.json casuale (`node tools/genera-db.js`) · `tools/hash-password.js` per cambiare la password

## Schermata principale
In alto: titolo, icona 📊 (statistiche) e menu ⋮ (importa esercizi, esporta statistiche, installa app, versione e autore).
Sotto il titolo il **Mix di tutto** (`mixPerFunzione` esercizi per gioco, 5 × 11 giochi = 55), poi i singoli giochi come approfondimento (10 esercizi, `perSezione`).
Giochi: serie, più e meno, segni < = >, prima e dopo, metti in ordine, il più piccolo/grande, calcoli in colonna (standard e facile), il numero mancante (standard e facile), abaco. Pulsante 💡 Aiuto in ogni esercizio.

## data/db.json
Per cambiare gli esercizi basta sostituire il file e ripubblicare (poi alza `VERSION` in `sw.js` e `APP_VERSION` in `js/utils.js`). Numeri da 0 a 100.
- serie: `{"tipo":"serie","numeri":[10,15,null,25,null,35]}`
- salti: `{"tipo":"salti","partenza":34,"operazioni":[5,-3,10]}`
- confronto: `{"tipo":"confronto","a":45,"b":54}`
- prima_dopo: `{"tipo":"prima_dopo","numero":47}`
- ordina: `{"tipo":"ordina","numeri":[42,7,63,19],"ordine":"crescente|decrescente"}`
- minmax: `{"tipo":"minmax","numeri":[42,7,63],"chiedi":"minore|maggiore"}`
- colonna: `{"tipo":"colonna","operazione":"+|-","a":47,"b":38}` (risultato tra 0 e 100; con riporto/cambio viene chiesto anche quello)
- colonna facile: come sopra con `"livello":"facile"`; "b" deve essere una cifra (1–9) o una decina (10, 20, 30…)
- mancante: `{"tipo":"mancante","totale":75,"numeri":[20,null,5]}` (3–5 numeri, un solo null; il numero mancante è calcolato in automatico)
- mancante facile: come sopra con `"livello":"facile"`; tutti i numeri (anche quello mancante) devono essere decine intere o cifre, es. `{"tipo":"mancante","livello":"facile","totale":75,"numeri":[70,null]}` oppure `[20,50,null]`
- abaco: `{"tipo":"abaco","numero":37,"modalita":"leggi|costruisci"}`
Le voci non valide vengono scartate. Lo stesso formato si importa da ⋮ → "Importa esercizi": il file SOSTITUISCE db.json su quel dispositivo; con ⋮ → "Ripristina esercizi originali" si torna a db.json del sito.

## Statistiche
Salvate nel browser del dispositivo (un sito statico non può scrivere nel repository). Icona 📊: vista "Da sempre" e "Ultimi 30 giorni" (si basa sui totali giornalieri, che si registrano dalla v1.5). ⋮ → "Esporta statistiche" scarica `statistiche.json`.
In fondo alla pagina, a destra, "Azzera statistiche" chiede una password. Password iniziale: **Matematica2**. Per cambiarla: `node tools/hash-password.js NUOVA` e incolla il risultato in `resetPasswordHash` di `js/config.js`.
Nota: in un sito statico la password è una protezione "da bambino", non sicurezza vera (chi conosce il codice può aggirarla). Richiede https (GitHub Pages lo è).

## Aggiornamenti dell'app installata
Online, l'app scarica da sola i file nuovi e si ricarica quando sei nel menu. Dopo ogni modifica cambia `VERSION` in `sw.js` e `APP_VERSION` in `js/utils.js`.
