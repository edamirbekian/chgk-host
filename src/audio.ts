// Timer signals are synthesized with Web Audio, so no audio files are needed for them.

let ctx: AudioContext | null = null;
const ac = () => (ctx ??= new AudioContext());

function tone(freq: number, at: number, dur: number, vol: number, type: OscillatorType = 'sine') {
  const c = ac();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  const peak = Math.max(vol, 0.0002);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(c.destination);
  o.start(at);
  o.stop(at + dur + 0.05);
}

function gong(at: number, vol: number) {
  // Inharmonic partials with long decays approximate a struck gong.
  [1, 1.47, 2.09, 2.56, 3.39, 4.22].forEach((m, i) => tone(98 * m, at, 5 - i * 0.6, (vol * 0.35) / (i + 1)));
}

export type SignalName = 'start' | 'warn' | 'end' | 'answerEnd';

export function signal(name: SignalName, vol = 0.8) {
  const c = ac();
  if (c.state === 'suspended') void c.resume();
  const t = c.currentTime;
  switch (name) {
    case 'start':
      gong(t, vol);
      break;
    case 'warn':
      tone(880, t, 0.3, vol * 0.4, 'triangle');
      break;
    case 'end':
      tone(660, t, 1.4, vol * 0.5, 'triangle');
      tone(990, t, 1.4, vol * 0.2, 'sine');
      break;
    case 'answerEnd':
      tone(988, t, 0.18, vol * 0.4, 'triangle');
      tone(988, t + 0.25, 0.18, vol * 0.4, 'triangle');
      tone(1319, t + 0.5, 0.7, vol * 0.4, 'triangle');
      break;
  }
}
