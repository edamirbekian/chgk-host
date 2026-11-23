import { useEffect } from 'preact/hooks';
import { dicts } from '../i18n';
import { computeRows, questionList } from '../scoring';
import { useAppState } from '../state';
import { timeLeft } from '../timer';
import { useNow } from './TimerPanel';

function toggleFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen();
}

/** Public projector view. Reads the host's autosaved state and never writes it. */
export function Board() {
  const s = useAppState();
  const t = dicts[s.settings.lang];
  const now = useNow();
  const { game, timer } = s;
  const title = game.title || t.showName;

  useEffect(() => {
    document.title = `${t.board} · ${title}`;
    document.documentElement.lang = s.settings.lang;
  }, [title, s.settings.lang]);

  const rows = game.board.mode === 'frozen' && game.board.snapshot ? game.board.snapshot : computeRows(game);
  const qs = questionList(game.tours);
  const cq = qs[Math.min(game.current, qs.length - 1)];
  const showTimer = timer.phase === 'discussion' || timer.phase === 'answer';
  const secs = Math.ceil(timeLeft(timer, now) / 1000);
  const rating = game.board.showRating;

  return (
    <div class="board" onDblClick={toggleFullscreen} style={{ '--rows': Math.max(rows.length, 6) }}>
      <button class="board-fs" onClick={toggleFullscreen}>
        {t.fullscreen}
      </button>

      {game.board.mode === 'hidden' ? (
        <div class="board-splash">
          <div class="owl big">🦉</div>
          <h1>{title}</h1>
        </div>
      ) : (
        <>
          <header class="board-head">
            <h1>{title}</h1>
            <div class="board-status">
              {cq && game.board.mode === 'live' && (
                <span class="board-q">
                  {t.question} {cq.num}
                </span>
              )}
              {showTimer && (
                <span class={'board-timer' + (timer.phase === 'answer' ? ' answer' : secs <= 10 ? ' urgent' : '')}>
                  {secs}
                </span>
              )}
            </div>
          </header>
          <table class="board-table">
            <thead>
              <tr>
                <th class="b-place">{t.place}</th>
                <th class="b-team">{t.team}</th>
                {game.tours.map((_, i) => (
                  <th class="b-num">
                    {t.tour} {i + 1}
                  </th>
                ))}
                <th class="b-num b-total">{t.total}</th>
                {rating && <th class="b-num">{t.rating}</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.teamId} class={parseInt(r.place, 10) <= 3 && r.total > 0 ? 'podium' : ''}>
                  <td class="b-place">{r.place}</td>
                  <td class="b-team">{r.name}</td>
                  {game.tours.map((_, i) => (
                    <td class="b-num">{r.tours[i] ?? 0}</td>
                  ))}
                  <td class="b-num b-total">{r.total}</td>
                  {rating && <td class="b-num muted">{r.rating}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
