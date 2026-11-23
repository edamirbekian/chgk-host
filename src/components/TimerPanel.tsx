import { useEffect, useState } from 'preact/hooks';
import { dicts } from '../i18n';
import { useAppState } from '../state';
import {
  isPaused,
  isRunning,
  pauseTimer,
  resetTimer,
  resumeTimer,
  skipToAnswer,
  startTimer,
  timeLeft,
} from '../timer';

export function useNow(ms = 200) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

export function TimerPanel() {
  const s = useAppState();
  const t = dicts[s.settings.lang];
  const now = useNow();
  const { timer, settings } = s;
  const paused = isPaused(timer);
  const running = isRunning(timer);
  const idle = timer.phase === 'idle';

  const left = idle ? settings.discussionSec * 1000 : timeLeft(timer, now);
  const secs = Math.ceil(left / 1000);
  const total = (timer.phase === 'answer' ? settings.answerSec : settings.discussionSec) * 1000;
  const frac = idle || timer.phase === 'done' ? 1 : Math.max(0, Math.min(1, left / total));
  const urgent = timer.phase === 'discussion' && secs <= 10;

  return (
    <div class="card timer">
      <div class="card-title">
        {t.timer}
        <span class={'phase phase-' + timer.phase}>{paused ? t.paused : t[`phase_${timer.phase}`]}</span>
      </div>
      <div class={'digits' + (urgent ? ' urgent' : '') + (timer.phase === 'answer' ? ' answer' : '')}>
        {timer.phase === 'done' ? 0 : secs}
      </div>
      <div class="bar">
        <div class={'bar-fill phase-' + timer.phase} style={{ width: `${frac * 100}%` }} />
      </div>
      <div class="row">
        {paused ? (
          <button class="primary" onClick={resumeTimer}>
            {t.resume}
          </button>
        ) : running ? (
          <button class="primary" onClick={pauseTimer}>
            {t.pause}
          </button>
        ) : (
          <button class="primary" onClick={startTimer}>
            {t.start}
          </button>
        )}
        {timer.phase === 'discussion' && settings.answerSec > 0 && <button onClick={skipToAnswer}>{t.skip}</button>}
        <button class="ghost" onClick={resetTimer} disabled={idle}>
          {t.reset}
        </button>
      </div>
    </div>
  );
}
