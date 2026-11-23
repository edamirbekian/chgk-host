import { LOGO } from '../logo';

export function Logo({ size = 32, class: cls }: { size?: number; class?: string }) {
  return (
    <svg class={cls} width={size} height={size} viewBox="0 0 150 150" role="img" aria-label="Quizit">
      <circle cx="75" cy="75" r="75" fill={LOGO.red} />
      <path d={LOGO.ring} fill="none" stroke={LOGO.cream} stroke-width={LOGO.ringWidth} />
      <path d={LOGO.segment} fill={LOGO.amber} />
      <circle cx={LOGO.dot.cx} cy={LOGO.dot.cy} r={LOGO.dot.r} fill={LOGO.cream} />
    </svg>
  );
}
