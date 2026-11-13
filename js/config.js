// Impostazioni modificabili
const CFG = {
  perSezione: 10,        // esercizi per sezione
  bravaOgni: 3,          // la vocina dice "Brava!" ogni N risposte positive di fila
  mixPerFunzione: 3,     // esercizi per gioco nel "Mix di tutto" (mai ripetuti nello stesso mix)
  esclusiDalMix: ['col', 'man'], // versioni difficili: mai nel Mix, anche se rese visibili
  nascostiDefault: ['col', 'man'], // giochi nascosti finché non si riattivano da ⋮ (versioni difficili)
  stellaOltre: 85,       // ⭐ sul pulsante del gioco se le esatte superano questa % (servono almeno minEsercizi)
  attenzioneErrori: 30,  // ⚠️ se le sbagliate superano questa %
  attenzioneGiorni: 14,  // ⚠️ se il gioco non si fa da almeno questi giorni (2 settimane)
  minEsercizi: 5,        // esercizi minimi prima di mostrare ⭐ o ⚠️ per le percentuali
  // password per azzerare le statistiche (impronta SHA-256). Per cambiarla:  node tools/hash-password.js NUOVAPASSWORD
  resetPasswordHash: '4006b83a55baab5cebb54e0a3fe8f70eecc6ae21f27a5a6d1c9073a229458fb1'
};
