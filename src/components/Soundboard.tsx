import { useEffect, useRef, useState } from 'preact/hooks';
import { dicts } from '../i18n';
import { sounds, type Sound } from '../sounds';
import { update, useAppState } from '../state';

const fmtTime = (s: number) => (isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '–:––');

export function Soundboard() {
  const s = useAppState();
  const t = dicts[s.settings.lang];
  const volume = s.settings.volume;
  const audios = useRef(new Map<string, HTMLAudioElement>());
  const fade = useRef<number | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [pos, setPos] = useState({ cur: 0, dur: 0 });

  const cancelFade = () => {
    if (fade.current != null) clearInterval(fade.current);
    fade.current = null;
  };

  const audioFor = (snd: Sound) => {
    let a = audios.current.get(snd.id);
    if (!a) {
      a = new Audio(snd.url);
      a.preload = 'auto';
      a.addEventListener('ended', () => setPlaying((p) => (p === snd.id ? null : p)));
      a.addEventListener('timeupdate', () => setPos({ cur: a!.currentTime, dur: a!.duration }));
      audios.current.set(snd.id, a);
    }
    return a;
  };

  const stopAll = () => {
    cancelFade();
    audios.current.forEach((a) => {
      a.pause();
      a.currentTime = 0;
    });
    setPlaying(null);
    setPaused(false);
  };

  const press = (snd: Sound) => {
    const a = audioFor(snd);
    if (playing === snd.id) {
      if (a.paused) void a.play();
      else a.pause();
      setPaused(!a.paused);
      return;
    }
    stopAll();
    a.volume = volume;
    void a.play();
    setPlaying(snd.id);
  };

  const fadeOut = () => {
    const a = playing && audios.current.get(playing);
    if (!a || fade.current != null) return;
    const from = a.volume;
    const t0 = performance.now();
    fade.current = window.setInterval(() => {
      const k = 1 - (performance.now() - t0) / 2500;
      if (k <= 0) stopAll();
      else a.volume = from * k;
    }, 50);
  };

  useEffect(() => {
    if (fade.current == null) audios.current.forEach((a) => (a.volume = volume));
  }, [volume]);

  useEffect(() => stopAll, []);

  return (
    <div class="card">
      <div class="card-title">{t.sounds}</div>
      {sounds.length === 0 ? (
        <p class="muted small-text">{t.noSounds}</p>
      ) : (
        <div class="pads">
          {sounds.map((snd) => (
            <button class={'pad' + (playing === snd.id ? (paused ? ' paused' : ' playing') : '')} onClick={() => press(snd)}>
              <span class="pad-icon">{playing === snd.id && !paused ? '❚❚' : '▶'}</span>
              <span class="pad-label">{snd.label}</span>
              {playing === snd.id && (
                <span class="pad-time">
                  {fmtTime(pos.cur)} / {fmtTime(pos.dur)}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      <div class="row">
        <button onClick={fadeOut} disabled={!playing || paused}>
          {t.fadeOut}
        </button>
        <button class="ghost" onClick={stopAll} disabled={!playing}>
          {t.stop}
        </button>
      </div>
      <label class="slider">
        <span>{t.volume}</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onInput={(e) => update((x) => (x.settings.volume = Number(e.currentTarget.value)))}
        />
      </label>
    </div>
  );
}
