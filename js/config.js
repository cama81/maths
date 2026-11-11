// Impostazioni modificabili
const CFG = {
  perSezione: 10,        // esercizi per sezione
  bravaOgni: 3,          // la vocina dice "Brava!" ogni N risposte positive di fila
  mixPerFunzione: 5,     // esercizi per gioco nel "Mix di tutto"
  // password per azzerare le statistiche (impronta SHA-256). Per cambiarla:  node tools/hash-password.js NUOVAPASSWORD
  resetPasswordHash: '4006b83a55baab5cebb54e0a3fe8f70eecc6ae21f27a5a6d1c9073a229458fb1'
};
