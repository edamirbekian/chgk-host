import { signal, type SignalName } from './audio';
import { getState, idleTimer, update, type Timer } from './state';

export function timeLeft(t: Timer, now = Date.now()): number {
  if (t.pausedLeft != null) return t.pausedLeft;
  if (t.endsAt != null) return Math.max(0, t.endsAt - now);
  return 0;
}

export const isRunning = (t: Timer) => (t.phase === 'discussion' || t.phase === 'answer') && t.endsAt != null;
export const isPaused = (t: Timer) => t.pausedLeft != null;

function sig(name: SignalName) {
  const { settings } = getState();
  if (settings.signals) signal(name, settings.volume);
}

export function startTimer() {
  update((s) => {
    const ms = s.settings.discussionSec * 1000;
    s.timer = { phase: 'discussion', endsAt: Date.now() + ms, pausedLeft: null, warned: ms <= 10_000 };
  });
  sig('start');
}

export function pauseTimer() {
  update((s) => {
    s.timer.pausedLeft = timeLeft(s.timer);
    s.timer.endsAt = null;
  });
}

export function resumeTimer() {
  update((s) => {
    s.timer.endsAt = Date.now() + (s.timer.pausedLeft ?? 0);
    s.timer.pausedLeft = null;
  });
}

export function resetTimer() {
  update((s) => {
    s.timer = idleTimer();
  });
}

export function skipToAnswer() {
  sig('end');
  update((s) => {
    s.timer = { phase: 'answer', endsAt: Date.now() + s.settings.answerSec * 1000, pausedLeft: null, warned: true };
  });
}

/** Space-bar behaviour: start, pause, or resume depending on the state. */
export function toggleTimer() {
  const { timer } = getState();
  if (isPaused(timer)) resumeTimer();
  else if (isRunning(timer)) pauseTimer();
  else startTimer();
}

/** Called frequently by the host window: plays signals and advances phases. */
export function tickTimer() {
  const { timer, settings } = getState();
  if (!isRunning(timer)) return;
  const left = timer.endsAt! - Date.now();
  // After a reload long past the deadline, advance silently instead of beeping late.
  const stale = left < -3000;

  if (timer.phase === 'discussion' && !timer.warned && left <= 10_000 && left > 0) {
    update((s) => {
      s.timer.warned = true;
    });
    sig('warn');
  }
  if (left > 0) return;

  if (timer.phase === 'discussion') {
    if (!stale) sig('end');
    update((s) => {
      s.timer =
        settings.answerSec > 0
          ? { phase: 'answer', endsAt: timer.endsAt! + settings.answerSec * 1000, pausedLeft: null, warned: true }
          : { ...idleTimer(), phase: 'done' };
    });
  } else {
    if (!stale) sig('answerEnd');
    update((s) => {
      s.timer = { ...idleTimer(), phase: 'done' };
    });
  }
}
