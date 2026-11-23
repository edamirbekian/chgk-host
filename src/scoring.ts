import type { Game, Row } from './state';

export interface Question {
  key: string;
  tour: number;
  /** 1-based number across the whole game, as in ChGK protocols. */
  num: number;
}

export function questionList(tours: number[]): Question[] {
  const out: Question[] = [];
  let num = 0;
  tours.forEach((count, tour) => {
    for (let q = 0; q < count; q++) out.push({ key: `${tour}:${q}`, tour, num: ++num });
  });
  return out;
}

/** Number of teams that answered each question correctly. */
export function correctCounts(game: Game): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const q of questionList(game.tours)) {
    counts[q.key] = game.teams.filter((t) => game.marks[t.id]?.[q.key]).length;
  }
  return counts;
}

/**
 * Standings: by total correct answers, then by rating.
 * A question is worth (teams that missed it + 1); a team's rating is the sum over
 * the questions it answered. Teams still equal on both share a place ("2–3").
 */
export function computeRows(game: Game): Row[] {
  const qs = questionList(game.tours).filter((q) => !game.removed[q.key]);
  const counts = correctCounts(game);
  const n = game.teams.length;

  const rows = game.teams.map((team) => {
    const tours = game.tours.map(() => 0);
    let total = 0;
    let rating = 0;
    for (const q of qs) {
      if (!game.marks[team.id]?.[q.key]) continue;
      tours[q.tour]++;
      total++;
      rating += n - counts[q.key] + 1;
    }
    return { teamId: team.id, name: team.name, tours, total, rating, place: '' };
  });

  rows.sort((a, b) => b.total - a.total || b.rating - a.rating);

  for (let i = 0; i < rows.length; ) {
    let j = i;
    while (j + 1 < rows.length && rows[j + 1].total === rows[i].total && rows[j + 1].rating === rows[i].rating) j++;
    const place = i === j ? `${i + 1}` : `${i + 1}–${j + 1}`;
    for (let k = i; k <= j; k++) rows[k].place = place;
    i = j + 1;
  }
  return rows;
}
