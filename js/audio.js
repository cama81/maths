// Suoni e vocina: suono dolce per le risposte sbagliate (WebAudio) e voce femminile italiana (sintesi vocale del dispositivo)
const SND_KEY = 'matematica2.suoni';
let SOUND_ON = (() => { try { return localStorage.getItem(SND_KEY) !== 'off'; } catch (e) { return true; } })();
let _ac = null, _voice;

function setSound(on) { SOUND_ON = on; try { localStorage.setItem(SND_KEY, on ? 'on' : 'off'); } catch (e) {} if (!on) stopVoice(); }

// "bu-bu" morbido e discendente, non spaventoso
function soundWrong() {
  if (!SOUND_ON) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    _ac = _ac || new AC(); if (_ac.resume) _ac.resume();
    [[330, 0], [247, .2]].forEach(([f, t]) => {
      const o = _ac.createOscillator(), g = _ac.createGain(), s = _ac.currentTime + t;
      o.type = 'triangle'; o.frequency.setValueAtTime(f, s);
      g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(0.22, s + .03); g.gain.exponentialRampToValueAtTime(0.0001, s + .25);
      o.connect(g); g.connect(_ac.destination); o.start(s); o.stop(s + .27);
    });
  } catch (e) {}
}

// Sceglie una voce italiana femminile, se il dispositivo ne ha una
function pickVoice() {
  try {
    const vs = (speechSynthesis.getVoices() || []).filter(v => /^it/i.test(v.lang));
    if (!vs.length) return null;
    return vs.find(v => /elsa|alice|federica|paola|lucia|silvia|carla|female|donna|google/i.test(v.name)) || vs[0];
  } catch (e) { return null; }
}
function stopVoice() { try { speechSynthesis.cancel(); } catch (e) {} }
// Voce acuta e squillante "da principessa"
function speak(text) {
  if (!SOUND_ON) return;
  try {
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'it-IT'; u.pitch = 1.6; u.rate = .95; u.volume = 1;
    _voice = pickVoice() || _voice; if (_voice) u.voice = _voice;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  } catch (e) {}
}
try { if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => { _voice = pickVoice(); }; } catch (e) {}
