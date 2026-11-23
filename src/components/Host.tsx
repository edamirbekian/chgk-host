import { useEffect, useState } from 'preact/hooks';
import { exportCsv, exportPng } from '../export';
import { dicts, langNames } from '../i18n';
import { questionList } from '../scoring';
import { idleTimer, newGame, update, useAppState, type Lang } from '../state';
import { tickTimer, toggleTimer } from '../timer';
import { BoardControls } from './BoardControls';
import { Logo } from './Logo';
import { ScoreGrid } from './ScoreGrid';
import { Setup } from './Setup';
import { Soundboard } from './Soundboard';
import { Spotify } from './Spotify';
import { TimerPanel } from './TimerPanel';

export function openBoard() {
  window.open(location.pathname + '#board', 'chgk-board', 'popup,width=1280,height=720');
}

export function Host() {
  const s = useAppState();
  const t = dicts[s.settings.lang];
  const { game } = s;
  const qs = questionList(game.tours);
  const current = Math.min(game.current, Math.max(0, qs.length - 1));
  const cq = qs[current];
  const [setupOpen, setSetupOpen] = useState(game.teams.length === 0);

  useEffect(() => {
    document.title = t.appTitle;
    document.documentElement.lang = s.settings.lang;
  }, [s.settings.lang]);

  // Drives timer signals and phase changes.
  useEffect(() => {
    const id = setInterval(tickTimer, 100);
    return () => clearInterval(id);
  }, []);

  const move = (d: number) =>
    update((x) => {
      const n = questionList(x.game.tours).length;
      x.game.current = Math.max(0, Math.min(n - 1, Math.min(x.game.current, n - 1) + d));
      // A finished timer resets for the next question; a running one is left alone.
      if (x.timer.phase === 'done') x.timer = idleTimer();
    });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (setupOpen || e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement).closest('input, textarea, select')) return;
      if (e.code === 'Space') {
        e.preventDefault();
        // Keep a focused button from also receiving the space-bar click.
        (document.activeElement as HTMLElement | null)?.blur();
        toggleTimer();
      } else if (e.key === 'ArrowRight') move(1);
      else if (e.key === 'ArrowLeft') move(-1);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [setupOpen]);

  const resetGame = () => {
    if (!confirm(t.confirmNewGame)) return;
    update((x) => {
      x.game = newGame();
      x.timer = idleTimer();
    });
    setSetupOpen(true);
  };

  return (
    <div class="host">
      <header class="topbar">
        <div class="brand">
          <Logo size={38} />
          <div class="brand-text">
            <span class="wordmark">quizit</span>
            <span class="brand-sub">{game.title || t.showName}</span>
          </div>
        </div>

        {cq && (
          <div class="qnav">
            <button class="icon" onClick={() => move(-1)} disabled={current === 0} aria-label="‹">
              ‹
            </button>
            <span class={'qlabel' + (game.removed[cq.key] ? ' removed' : '')}>
              {t.question} <b>{cq.num}</b>
              <small>
                {' '}
                / {qs.length} · {t.tour} {cq.tour + 1}
              </small>
            </span>
            <button class="icon" onClick={() => move(1)} disabled={current >= qs.length - 1} aria-label="›">
              ›
            </button>
            <button
              class="ghost small"
              onClick={() =>
                update((x) => {
                  if (x.game.removed[cq.key]) delete x.game.removed[cq.key];
                  else x.game.removed[cq.key] = true;
                })
              }
            >
              {game.removed[cq.key] ? t.restoreQuestion : t.removeQuestion}
            </button>
          </div>
        )}

        <div class="actions">
          <select
            value={s.settings.lang}
            onChange={(e) => update((x) => (x.settings.lang = e.currentTarget.value as Lang))}
            aria-label={t.language}
          >
            {(Object.keys(langNames) as Lang[]).map((l) => (
              <option value={l}>{langNames[l]}</option>
            ))}
          </select>
          <button onClick={openBoard}>{t.openBoard}</button>
          <div class="split">
            <span class="split-label">{t.exportLabel}</span>
            <button class="small" onClick={() => exportCsv(game, t)} disabled={!game.teams.length}>
              CSV
            </button>
            <button
              class="small"
              onClick={() => exportPng(game, t, s.settings.lang)}
              disabled={!game.teams.length}
            >
              PNG
            </button>
          </div>
          <button onClick={() => setSetupOpen(true)}>{t.setup}</button>
          <button class="ghost danger" onClick={resetGame}>
            {t.newGame}
          </button>
        </div>
      </header>

      <main class="layout">
        <section class="grid-wrap">
          {game.teams.length ? <ScoreGrid game={game} t={t} current={current} /> : <p class="empty">{t.noTeams}</p>}
          <p class="hint">{t.keyboardHint}</p>
        </section>
        <aside class="side">
          <TimerPanel />
          <BoardControls />
          <Soundboard />
          <Spotify />
        </aside>
      </main>

      {setupOpen && <Setup onClose={() => setSetupOpen(false)} />}
    </div>
  );
}
