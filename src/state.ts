import { useEffect, useState } from 'preact/hooks';

export type Lang = 'ru' | 'en' | 'hy';

export interface Team {
  id: string;
  name: string;
}

export interface Row {
  teamId: string;
  name: string;
  tours: number[];
  total: number;
  rating: number;
  place: string;
}

export type BoardMode = 'live' | 'frozen' | 'hidden';

export interface Game {
  title: string;
  teams: Team[];
  /** Number of questions in each tour. */
  tours: number[];
  /** teamId -> question key ("tour:index") -> answered correctly */
  marks: Record<string, Record<string, true>>;
  /** Question keys removed from scoring ("снятые вопросы"). */
  removed: Record<string, true>;
  /** Global index of the current question. */
  current: number;
  board: { mode: BoardMode; snapshot: Row[] | null; showRating: boolean };
}

export type Phase = 'idle' | 'discussion' | 'answer' | 'done';

export interface Timer {
  phase: Phase;
  /** Epoch ms when the current phase ends; null when idle or paused. */
  endsAt: number | null;
  /** Remaining ms while paused. */
  pausedLeft: number | null;
  /** Whether the 10-seconds-left signal has played for this question. */
  warned: boolean;
}

export interface Settings {
  lang: Lang;
  discussionSec: number;
  answerSec: number;
  signals: boolean;
  volume: number;
  spotifyEmbed: string;
  spotifyClientId: string;
}

export interface AppState {
  settings: Settings;
  game: Game;
  timer: Timer;
}

const KEY = 'chgk-host/v1';

export const newGame = (): Game => ({
  title: '',
  teams: [],
  tours: [12, 12, 12],
  marks: {},
  removed: {},
  current: 0,
  board: { mode: 'live', snapshot: null, showRating: true },
});

export const idleTimer = (): Timer => ({ phase: 'idle', endsAt: null, pausedLeft: null, warned: false });

const defaults = (): AppState => ({
  settings: {
    lang: 'hy',
    discussionSec: 60,
    answerSec: 20,
    signals: true,
    volume: 0.8,
    spotifyEmbed: '',
    spotifyClientId: '',
  },
  game: newGame(),
  timer: idleTimer(),
});

function load(): AppState {
  const d = defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return d;
    const s = JSON.parse(raw);
    return {
      settings: { ...d.settings, ...s.settings },
      game: { ...d.game, ...s.game, board: { ...d.game.board, ...s.game?.board } },
      timer: { ...d.timer, ...s.timer },
    };
  } catch {
    return d;
  }
}

let state = load();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const getState = () => state;

/** Apply a mutation to a copy of the state, autosave it, and notify subscribers. */
export function update(fn: (s: AppState) => void) {
  const next = structuredClone(state);
  fn(next);
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked: keep working in memory.
  }
  emit();
}

// The scoreboard window stays in sync through storage events from the host window.
addEventListener('storage', (e) => {
  if (e.key === KEY) {
    state = load();
    emit();
  }
});

export function useAppState(): AppState {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return state;
}

export const uid = () => Math.random().toString(36).slice(2, 10);
