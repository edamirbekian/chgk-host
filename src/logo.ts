// Quizit "Q" mark, traced from the brand avatar. Coordinates are in a 150×150 box.
export const LOGO = {
  red: '#c23031',
  cream: '#fff3e3',
  amber: '#ffc354',
  ring: 'M49.3 85.45A27.5 27.5 0 1 1 89.8 83.7',
  ringWidth: 15,
  segment: 'M86.1 98.7A37 37 0 0 1 51.4 98.7L58.9 84.5A21 21 0 0 0 78.6 84.5Z',
  dot: { cx: 110, cy: 110, r: 7.5 },
};

/** Draws the mark (with its red disc) onto a canvas at x, y with the given size. */
export function drawLogo(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 150, size / 150);
  ctx.fillStyle = LOGO.red;
  ctx.beginPath();
  ctx.arc(75, 75, 75, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = LOGO.cream;
  ctx.lineWidth = LOGO.ringWidth;
  ctx.stroke(new Path2D(LOGO.ring));
  ctx.fillStyle = LOGO.amber;
  ctx.fill(new Path2D(LOGO.segment));
  ctx.fillStyle = LOGO.cream;
  ctx.beginPath();
  ctx.arc(LOGO.dot.cx, LOGO.dot.cy, LOGO.dot.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
