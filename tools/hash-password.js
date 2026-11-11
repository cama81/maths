// Uso: node tools/hash-password.js NUOVAPASSWORD  -> stampa l'impronta da incollare in js/config.js (resetPasswordHash)
console.log(require('crypto').createHash('sha256').update(process.argv[2] || '').digest('hex'));
