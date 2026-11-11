# Matematica in gioco – 2ª elementare

Aprire `index.html` nel browser (nessun server necessario).

## Struttura
- `index.html` – pagina e caricamento degli script
- `css/style.css` – stile (chiaro/scuro automatico)
- `js/utils.js` – funzioni di utilità
- `js/generators.js` – esercizi casuali (serie, salti, confronto, prima/dopo, abaco)
- `js/custom.js` – import/validazione dei file di esercizi, salvataggio locale
- `js/render.js` – archetti, caselle, abaco, tastierino
- `js/app.js` – menu e flusso di gioco
- `data/esempio-esercizi.json` – esempio di file importabile

## Formato del file di esercizi (JSON)
Numeri sempre da 0 a 100.
- serie: `{"tipo":"serie","numeri":[10,15,null,25,null,35]}` (null = da completare; il passo è ricavato in automatico, anche all'indietro)
- salti: `{"tipo":"salti","partenza":34,"operazioni":[5,-3,10]}`
- confronto: `{"tipo":"confronto","a":45,"b":54}`
- prima_dopo: `{"tipo":"prima_dopo","numero":47,"chiedi":"prima|dopo|entrambi"}`
- abaco: `{"tipo":"abaco","numero":37,"modalita":"leggi|costruisci"}`
Campo opzionale `"titolo"` per serie e salti.

Gli esercizi importati si aggiungono ai precedenti, sono salvati nel browser e compaiono sia nel gioco "I miei esercizi" sia mescolati (circa 1 su 3) nel gioco del loro tipo.
