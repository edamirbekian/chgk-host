import type { Dict } from './i18n';
import { computeRows, questionList } from './scoring';
import type { Game } from './state';

function download(blob: Blob, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const baseName = (game: Game) => {
  const date = new Date().toISOString().slice(0, 10);
  const title = game.title.trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'chgk';
  return `${title}-${date}`;
};

export function exportCsv(game: Game, t: Dict) {
  const qs = questionList(game.tours);
  const rows = computeRows(game);
  const header = [
    t.place,
    t.team,
    ...qs.map((q) => String(q.num)),
    ...game.tours.map((_, i) => `${t.tour} ${i + 1}`),
    t.total,
    t.rating,
  ];
  const lines = [header];
  for (const r of rows) {
    const marks = game.marks[r.teamId] ?? {};
    lines.push([
      r.place,
      r.name,
      ...qs.map((q) => (game.removed[q.key] ? '' : marks[q.key] ? '1' : '0')),
      ...r.tours.map(String),
      String(r.total),
      String(r.rating),
    ]);
  }
  const esc = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  // BOM so Excel opens Cyrillic and Armenian text as UTF-8.
  const csv = '﻿' + lines.map((l) => l.map(esc).join(',')).join('\r\n');
  download(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `${baseName(game)}.csv`);
}

export function exportPng(game: Game, t: Dict, lang: string) {
  const rows = computeRows(game);
  const font = (weight: number, px: number) =>
    `${weight} ${px}px system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans Armenian", Sylfaen, sans-serif`;
  const scale = 2;
  const pad = 48;
  const titleH = 120;
  const headH = 48;
  const rowH = 54;
  const placeW = 100;
  const tourW = 84;
  const sumW = 110;
  const ratW = game.board.showRating ? 120 : 0;

  const measure = document.createElement('canvas').getContext('2d')!;
  measure.font = font(600, 24);
  const teamW = Math.min(560, Math.max(280, ...rows.map((r) => measure.measureText(r.name).width + 32)));

  const width = pad * 2 + placeW + teamW + game.tours.length * tourW + sumW + ratW;
  const height = titleH + headH + rows.length * rowH + pad;
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  ctx.fillStyle = '#0b1220';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#e8b64c';
  ctx.font = font(800, 40);
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(game.title || t.showName, pad, 70);
  ctx.fillStyle = '#8b98b5';
  ctx.font = font(500, 18);
  ctx.fillText(new Date().toLocaleDateString(lang, { dateStyle: 'long' }), pad, 100);

  const cols: { label: string; w: number; align: CanvasTextAlign }[] = [
    { label: t.place, w: placeW, align: 'left' },
    { label: t.team, w: teamW, align: 'left' },
    ...game.tours.map((_, i) => ({ label: `${t.tour} ${i + 1}`, w: tourW, align: 'center' as const })),
    { label: t.total, w: sumW, align: 'center' },
    ...(ratW ? [{ label: t.rating, w: ratW, align: 'center' as const }] : []),
  ];

  const drawCells = (values: string[], y: number, color = (_col: number) => ctx.fillStyle) => {
    let x = pad;
    values.forEach((v, i) => {
      const c = cols[i];
      ctx.fillStyle = color(i);
      ctx.textAlign = c.align;
      const tx = c.align === 'center' ? x + c.w / 2 : x + 8;
      let text = v;
      while (ctx.measureText(text).width > c.w - 16 && text.length > 1) text = text.slice(0, -2) + '…';
      ctx.fillText(text, tx, y);
      x += c.w;
    });
  };

  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#8b98b5';
  ctx.font = font(600, 16);
  drawCells(
    cols.map((c) => c.label.toUpperCase()),
    titleH + headH / 2,
  );

  rows.forEach((r, i) => {
    const y = titleH + headH + i * rowH;
    if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fillRect(pad, y, width - pad * 2, rowH);
    }
    const podium = parseInt(r.place, 10) <= 3;
    ctx.font = font(podium ? 700 : 500, 24);
    const totalCol = 2 + game.tours.length;
    drawCells(
      [r.place, r.name, ...r.tours.map(String), String(r.total), ...(ratW ? [String(r.rating)] : [])],
      y + rowH / 2,
      (col) => ((podium && col < 2) || col === totalCol ? '#e8b64c' : col > totalCol ? '#8b98b5' : '#e8edf7'),
    );
  });

  canvas.toBlob((b) => b && download(b, `${baseName(game)}.png`), 'image/png');
}
