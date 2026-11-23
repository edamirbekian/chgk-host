import type { Dict } from '../i18n';
import { computeRows, correctCounts, questionList } from '../scoring';
import { update, type Game } from '../state';

interface Props {
  game: Game;
  t: Dict;
  current: number;
}

function toggleMark(teamId: string, key: string) {
  update((s) => {
    const m = (s.game.marks[teamId] ??= {});
    if (m[key]) delete m[key];
    else m[key] = true;
  });
}

export function ScoreGrid({ game, t, current }: Props) {
  const qs = questionList(game.tours);
  const rows = new Map(computeRows(game).map((r) => [r.teamId, r]));
  const counts = correctCounts(game);
  const tourStart = (i: number) => i === 0 || qs[i - 1].tour !== qs[i].tour;
  const qClass = (i: number) =>
    [tourStart(i) && 'tour-start', i === current && 'current', game.removed[qs[i].key] && 'removed']
      .filter(Boolean)
      .join(' ');

  return (
    <table class="grid">
      <thead>
        <tr>
          <th rowSpan={2} class="sticky team-col">
            {t.team}
          </th>
          {game.tours.map(
            (n, i) =>
              n > 0 && (
                <th colSpan={n} class="tour-head tour-start">
                  {t.tour} {i + 1}
                </th>
              ),
          )}
          <th colSpan={game.tours.length} class="tour-start sum-head">
            {t.tours}
          </th>
          <th rowSpan={2} class="sum-head">
            {t.total}
          </th>
          <th rowSpan={2} class="sum-head">
            {t.rating}
          </th>
          <th rowSpan={2} class="sum-head">
            {t.place}
          </th>
        </tr>
        <tr>
          {qs.map((q, i) => (
            <th class={'qnum ' + qClass(i)} onClick={() => update((s) => (s.game.current = i))}>
              {q.num}
            </th>
          ))}
          {game.tours.map((_, i) => (
            <th class={'sum-head' + (i === 0 ? ' tour-start' : '')}>{i + 1}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {game.teams.map((team) => {
          const r = rows.get(team.id)!;
          const marks = game.marks[team.id] ?? {};
          return (
            <tr key={team.id}>
              <th class="sticky team-col" title={team.name}>
                {team.name}
              </th>
              {qs.map((q, i) => (
                <td class={'cell ' + qClass(i) + (marks[q.key] ? ' on' : '')} onClick={() => toggleMark(team.id, q.key)}>
                  {marks[q.key] ? '+' : ''}
                </td>
              ))}
              {r.tours.map((n, i) => (
                <td class={'num' + (i === 0 ? ' tour-start' : '')}>{n}</td>
              ))}
              <td class="num total">{r.total}</td>
              <td class="num">{r.rating}</td>
              <td class="num place">{r.place}</td>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr>
          <th class="sticky team-col">{t.correct}</th>
          {qs.map((q, i) => (
            <td class={'num ' + qClass(i)}>{game.removed[q.key] ? '–' : counts[q.key]}</td>
          ))}
          <td colSpan={game.tours.length + 3} class="tour-start" />
        </tr>
      </tfoot>
    </table>
  );
}
