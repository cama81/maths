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

## App installabile (PWA) e aggiornamenti
- Il sito si può installare su telefono/tablet: Android/Chrome → menu ⋮ → "Installa app" (o il pulsante 📲 nel menu); iPhone/iPad (Safari) → Condividi → "Aggiungi alla schermata Home".
- Funziona anche offline. Quando sei online e ripubblichi su GitHub Pages, l'app scarica i file nuovi da sola e si ricarica quando sei nel menu.
- Per forzare l'aggiornamento della cache dopo modifiche, cambia `VERSION` in `sw.js` (es. 'v2').
- I file devono stare alla radice del repository (accanto a `index.html`); icone in `icon-*.png`, configurazione in `manifest.webmanifest`.
