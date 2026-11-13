# Matematica in gioco – 2ª elementare (v1.14.0)

Va pubblicata su un sito (GitHub Pages) o aperta con un server locale (`python3 -m http.server`), perché legge `data/db.json`.

## Struttura
- `index.html`, `manifest.webmanifest`, `sw.js` (app installabile e offline), icone `icon-*.png` e `favicon-*.png` (usate anche come icona nella scheda del browser)
- `css/style.css` · `img/fiaba.svg` (sfondo fiabesco leggero; `castello.svg` e `stelle.svg` sono presenti ma non usati)
- `js/config.js` impostazioni (esercizi per sezione, mix, password di reset)
- `js/utils.js` utilità e numero versione · `js/models.js` tipi di esercizio, controlli e aiuto
- `js/stats.js` raccolta dati · `js/statsui.js` schermata statistiche · `js/custom.js` caricamento/import db · `js/render.js` disegno · `js/app.js` gioco · `js/pwa.js` installazione/aggiornamenti
- `data/db.json` TUTTI gli esercizi · `data/statistiche.json` modello vuoto delle statistiche
- `tools/genera-db.js` rigenera un db.json casuale (`node tools/genera-db.js`) · `tools/hash-password.js` per cambiare la password

## Schermata principale
In alto: titolo, icona 📊 (statistiche) e menu ⋮ (importa esercizi, esporta/importa dati, giochi nascosti, installa app, versione e autore).
Sotto il titolo il **Mix di tutto** (`mixPerFunzione` esercizi per gioco, 3 × 9 = 27; le versioni difficili "Calcoli in colonna" e "Il numero mancante" non sono mai nel Mix, `esclusiDalMix`; mai lo stesso esercizio due volte nello stesso mix), poi i singoli giochi come approfondimento (10 esercizi, `perSezione`). Durante il Mix il tasto Menu è bloccato (🔒) fino alla fine. Ogni esercizio del Mix conta nelle statistiche del suo gioco.
**Collezione premi:** sotto il titolo "Hai collezionato N ⭐" e il numero di trofei 🏆. Una stella per ogni sezione (o Mix) finita fino in fondo, qualunque sia il risultato; in più un trofeo se è finita con almeno il 90% (`trofeoDa`; le risposte con aiuto valgono metà). Al primo avvio la collezione parte da quanto già fatto. È salvata sul dispositivo e NON si azzera con "Azzera statistiche".
**Uscire a metà:** con "← Menu" in un gioco singolo gli esercizi già fatti restano nelle statistiche (si salvano uno per uno) e la sezione compare tra le ultime come "interrotta".
**Giochi nascosti:** "Calcoli in colonna" e "Il numero mancante" (le versioni difficili) all'inizio sono nascosti; si riattivano da ⋮ (la scelta resta salvata sul dispositivo, `nascostiDefault` in `js/config.js`).
**Segnalini sui pulsanti** (dati degli ultimi 30 giorni, o dall'inizio se negli ultimi 30 giorni ci sono meno di 5 esercizi): ⭐ se le esatte superano l'85%; ⚠️ se le sbagliate superano il 30% oppure se il gioco non si fa da almeno 2 settimane. Servono almeno 5 esercizi per le percentuali. Soglie in `js/config.js`.
Giochi: serie, più e meno, segni < = >, prima e dopo, metti in ordine, il più piccolo/grande, calcoli in colonna (standard e facile), il numero mancante (standard e facile), abaco. Pulsante 💡 Aiuto in ogni esercizio.

## data/db.json
Per cambiare gli esercizi basta sostituire il file e ripubblicare (poi alza `VERSION` in `sw.js` e `APP_VERSION` in `js/utils.js`). Numeri da 0 a 100.
- serie: `{"tipo":"serie","numeri":[10,15,null,25,null,35]}`
- salti: `{"tipo":"salti","partenza":34,"operazioni":[5,-3,10]}`
- confronto: `{"tipo":"confronto","a":45,"b":54}`
- prima_dopo: `{"tipo":"prima_dopo","numero":47}`
- ordina: `{"tipo":"ordina","numeri":[42,7,63,19],"ordine":"crescente|decrescente"}`
- minmax: `{"tipo":"minmax","numeri":[42,7,63],"chiedi":"minore|maggiore"}`
- colonna: `{"tipo":"colonna","operazione":"+|-","a":47,"b":38}` (risultato tra 0 e 100; con riporto/cambio viene chiesto anche quello; il segno è a destra del primo numero)
- colonna facile: come sopra con `"livello":"facile"`; "b" deve essere una cifra (1–9) o una decina (10, 20, 30…)
- mancante: `{"tipo":"mancante","totale":75,"numeri":[20,null,5]}` (3–5 numeri, un solo null; il numero mancante è calcolato in automatico)
- mancante facile: come sopra con `"livello":"facile"`; tutti i numeri (anche quello mancante) devono essere decine intere o cifre, es. `{"tipo":"mancante","livello":"facile","totale":75,"numeri":[70,null]}` oppure `[20,50,null]`
- abaco: `{"tipo":"abaco","numero":37,"modalita":"leggi|costruisci"}`
Le voci non valide vengono scartate. Lo stesso formato si importa da ⋮ → "Importa esercizi": il file SOSTITUISCE db.json su quel dispositivo; con ⋮ → "Ripristina esercizi originali" si torna a db.json del sito.

## Statistiche (per genitori e insegnanti)
Salvate nel browser del dispositivo (un sito statico non può scrivere nel repository). Icona 📊, due viste: **Ultimi 30 giorni** (con confronto sui 30 giorni precedenti) e **Dall'inizio**.
Per ogni esercizio si registra: esito (esatta senza aiuto / con aiuto / sbagliata), tentativi sbagliati, tempo (solo per le esatte conta nella media, massimo 2 minuti a esercizio) e il testo dell'esercizio se sbagliato o fatto con aiuto.
Schermata: quadro generale (svolti, % esatte, % con aiuto, % sbagliate, errori per esercizio, tempo per risposta esatta, giorni e minuti di gioco, record di fila) con freccette di miglioramento; frasi di sintesi; grafici dell'andamento (esatte, aiuto, tempo); tabella per gioco con trend, e toccando un gioco si vede il dettaglio dello stesso gioco; elenco "Da rivedere"; ultime sezioni.
I dati giornalieri (per l'andamento e i confronti) si registrano dalla v1.5 e si conservano per 2 anni; i totali "dall'inizio" comprendono anche i dati precedenti. ⋮ → "Esporta dati" scarica `matematica-dati.json` con tutto: statistiche (anche i giorni e l'elenco degli errori), collezione di stelle e trofei, impostazioni (giochi nascosti, suoni, esercizi importati).
**Più dispositivi:** ogni dispositivo ha le sue statistiche e i suoi premi. Con ⋮ → "Esporta dati" si scarica un file; con ⋮ → "Importa dati" su un altro dispositivo statistiche, stelle e trofei vengono sommati (giorno per giorno e gioco per gioco) e le impostazioni del file (giochi nascosti, suoni e, se presenti, esercizi importati) sostituiscono quelle del dispositivo. L'importazione si può ripetere ogni mese: per ogni dispositivo si tiene solo l'istantanea più recente, quindi non si contano mai due volte gli stessi esercizi, e importare un file con i dati del dispositivo stesso non cambia nulla. Il file esportato contiene anche i dati già importati, quindi basta scambiarsi un file per riunire tutto. Non è una sincronizzazione automatica. Vengono accettati anche i file di statistiche delle versioni precedenti (senza premi né impostazioni). "Azzera statistiche" non tocca stelle, trofei e impostazioni.
In fondo alla pagina, a destra, "Azzera statistiche" chiede una password. Password iniziale: **Matematica2**. Per cambiarla: `node tools/hash-password.js NUOVA` e incolla il risultato in `resetPasswordHash` di `js/config.js`. In un sito statico è una protezione "da bambino", non sicurezza vera. Richiede https (GitHub Pages lo è).

## Aggiornamenti dell'app installata
Online, l'app scarica da sola i file nuovi e si ricarica quando sei nel menu. Dopo ogni modifica cambia `VERSION` in `sw.js` e `APP_VERSION` in `js/utils.js`.

## Suoni e voce
Risposta sbagliata: suono morbido "bu-bu". Ogni risposta corretta: campanellino allegro (una nota breve per i passaggi intermedi di un esercizio a più caselle). Risposte giuste: la voce femminile dice "Brava!" una volta ogni 3 risposte positive di fila (quelle con aiuto contano; una risposta sbagliata azzera il conteggio; `bravaOgni` in `js/config.js`). Fine sezione (percentuale di esatte, le risposte con aiuto valgono metà): dal 70% "Ottimo lavoro!", dal 40% al 70% "Ci siamo quasi!", sotto il 40% "Puoi fare meglio!". Si spegne da ⋮ → "Suoni e voce".
La voce è quella di sintesi vocale del telefono/tablet/PC (voce italiana, resa più acuta): cambia da dispositivo a dispositivo. Se il dispositivo non ha una voce italiana, la sintesi usa quella predefinita o resta muta. Per un risultato uguale ovunque servirebbero registrazioni audio vere (file mp3 in una cartella `audio/`).
