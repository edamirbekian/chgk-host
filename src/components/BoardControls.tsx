import { dicts } from '../i18n';
import { computeRows } from '../scoring';
import { update, useAppState, type BoardMode } from '../state';

export function BoardControls() {
  const s = useAppState();
  const t = dicts[s.settings.lang];
  const { board } = s.game;

  const setMode = (mode: BoardMode) =>
    update((x) => {
      // Freezing captures the standings now; later marks stay hidden until going live.
      if (mode === 'frozen' && x.game.board.mode !== 'frozen') x.game.board.snapshot = computeRows(x.game);
      if (mode === 'live') x.game.board.snapshot = null;
      x.game.board.mode = mode;
    });

  return (
    <div class="card">
      <div class="card-title">{t.board}</div>
      <div class="segmented">
        {(['live', 'frozen', 'hidden'] as BoardMode[]).map((m) => (
          <button class={board.mode === m ? 'active' : ''} onClick={() => setMode(m)}>
            {t[m]}
          </button>
        ))}
      </div>
      <label class="check">
        <input
          type="checkbox"
          checked={board.showRating}
          onChange={(e) => update((x) => (x.game.board.showRating = e.currentTarget.checked))}
        />
        {t.showRating}
      </label>
    </div>
  );
}
