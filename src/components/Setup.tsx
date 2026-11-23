import { useState } from 'preact/hooks';
import { dicts, fmt } from '../i18n';
import { redirectUri } from '../spotify';
import { uid, update, useAppState } from '../state';

const clampInt = (v: string, min: number, max: number) => Math.max(min, Math.min(max, parseInt(v, 10) || 0));

export function Setup({ onClose }: { onClose: () => void }) {
  const s = useAppState();
  const t = dicts[s.settings.lang];
  const { game, settings } = s;
  const [name, setName] = useState('');
  const [bulk, setBulk] = useState('');

  const addTeams = (names: string[]) =>
    update((x) => {
      for (const n of names.map((v) => v.trim()).filter(Boolean)) x.game.teams.push({ id: uid(), name: n });
    });

  const removeTeam = (id: string, teamName: string) => {
    if (!confirm(fmt(t.confirmRemoveTeam, { name: teamName }))) return;
    update((x) => {
      x.game.teams = x.game.teams.filter((tm) => tm.id !== id);
      delete x.game.marks[id];
    });
  };

  const moveTeam = (i: number, d: number) =>
    update((x) => {
      const arr = x.game.teams;
      const j = i + d;
      if (j < 0 || j >= arr.length) return;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    });

  return (
    <div class="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="modal" role="dialog" aria-label={t.setup}>
        <div class="modal-head">
          <h2>{t.setup}</h2>
          <button class="primary" onClick={onClose}>
            {t.done}
          </button>
        </div>

        <div class="modal-body">
          <section>
            <label class="field">
              <span>{t.gameTitle}</span>
              <input
                value={game.title}
                placeholder={t.showName}
                onInput={(e) => update((x) => (x.game.title = e.currentTarget.value))}
              />
            </label>
          </section>

          <section>
            <h3>
              {t.teams} <span class="muted">({game.teams.length})</span>
            </h3>
            <ol class="team-list">
              {game.teams.map((tm, i) => (
                <li key={tm.id}>
                  <span class="muted idx">{i + 1}</span>
                  <input
                    class="grow"
                    value={tm.name}
                    onInput={(e) => update((x) => (x.game.teams[i].name = e.currentTarget.value))}
                  />
                  <button class="icon ghost" onClick={() => moveTeam(i, -1)} disabled={i === 0} aria-label="↑">
                    ↑
                  </button>
                  <button
                    class="icon ghost"
                    onClick={() => moveTeam(i, 1)}
                    disabled={i === game.teams.length - 1}
                    aria-label="↓"
                  >
                    ↓
                  </button>
                  <button class="icon ghost danger" onClick={() => removeTeam(tm.id, tm.name)} aria-label={t.remove}>
                    ✕
                  </button>
                </li>
              ))}
            </ol>
            <form
              class="row"
              onSubmit={(e) => {
                e.preventDefault();
                addTeams([name]);
                setName('');
              }}
            >
              <input class="grow" value={name} placeholder={t.teamName} onInput={(e) => setName(e.currentTarget.value)} />
              <button type="submit" disabled={!name.trim()}>
                {t.addTeam}
              </button>
            </form>
            <details>
              <summary>{t.bulkAdd}</summary>
              <textarea rows={6} value={bulk} onInput={(e) => setBulk(e.currentTarget.value)} />
              <button
                disabled={!bulk.trim()}
                onClick={() => {
                  addTeams(bulk.split('\n'));
                  setBulk('');
                }}
              >
                {t.addAll}
              </button>
            </details>
          </section>

          <section>
            <h3>{t.tours}</h3>
            <div class="tours">
              {game.tours.map((n, i) => (
                <label class="tour-input">
                  <span>
                    {t.tour} {i + 1}
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={n}
                    onChange={(e) => update((x) => (x.game.tours[i] = clampInt(e.currentTarget.value, 1, 99)))}
                  />
                  <span class="muted">{t.questionsInTour}</span>
                </label>
              ))}
            </div>
            <div class="row">
              <button onClick={() => update((x) => x.game.tours.push(x.game.tours.at(-1) ?? 12))}>{t.addTour}</button>
              {/* Only the last tour can go, so question keys of earlier tours stay stable. */}
              <button class="ghost" disabled={game.tours.length <= 1} onClick={() => update((x) => x.game.tours.pop())}>
                {t.removeLastTour}
              </button>
            </div>
          </section>

          <section>
            <h3>{t.timer}</h3>
            <div class="row wrap">
              <label class="field">
                <span>{t.discussionSec}</span>
                <input
                  type="number"
                  min={5}
                  max={600}
                  value={settings.discussionSec}
                  onChange={(e) => update((x) => (x.settings.discussionSec = clampInt(e.currentTarget.value, 5, 600)))}
                />
              </label>
              <label class="field">
                <span>{t.answerSec}</span>
                <input
                  type="number"
                  min={0}
                  max={600}
                  value={settings.answerSec}
                  onChange={(e) => update((x) => (x.settings.answerSec = clampInt(e.currentTarget.value, 0, 600)))}
                />
              </label>
            </div>
            <label class="check">
              <input
                type="checkbox"
                checked={settings.signals}
                onChange={(e) => update((x) => (x.settings.signals = e.currentTarget.checked))}
              />
              {t.signals}
            </label>
          </section>

          <section>
            <h3>{t.spotify}</h3>
            <label class="field">
              <span>{t.spotifyClientId}</span>
              <input
                value={settings.spotifyClientId}
                spellcheck={false}
                onInput={(e) => update((x) => (x.settings.spotifyClientId = e.currentTarget.value.trim()))}
              />
            </label>
            <p class="muted small-text">
              {t.spotifyRedirectHint} <code>{redirectUri()}</code>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
