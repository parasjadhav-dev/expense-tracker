// Axis ticks for money charts. Pure: no imports, no clock, no I/O.
//
// Amounts are integer paise. The ticks are "clean" rupee values (steps of 1, 2,
// 2.5 or 5 times a power of ten), start at zero, and the last one reaches the
// largest value, so the axis reads 0 / 5K / 10K / 15K instead of 0 / 4.5K / 9K / 13.5K.

const STEP_MULTIPLIERS = [1, 2, 2.5, 5];

// Ticks for a chart whose largest value is `maxPaise`, aiming for about
// `targetGaps` equal gaps between ticks. Always starts at 0 and ends at or above
// `maxPaise`, by less than one step. When two steps are equally close to the
// target, the larger one wins, which gives fewer, calmer gridlines.
export function niceTicks(maxPaise: number, targetGaps: number = 4): number[] {
  if (!Number.isFinite(maxPaise) || maxPaise <= 0) return [0];

  const wanted = Math.max(1, Math.floor(targetGaps));
  const exponent = Math.floor(Math.log10(maxPaise / 100 / wanted));

  let best: { step: number; gaps: number } | null = null;
  for (let e = exponent - 1; e <= exponent + 1; e++) {
    for (const multiplier of STEP_MULTIPLIERS) {
      // Whole paise only, so tick values stay exact integers.
      const step = Math.round(multiplier * Math.pow(10, e) * 100);
      if (step < 1) continue;
      const gaps = Math.ceil(maxPaise / step);
      const distance = Math.abs(gaps - wanted);
      if (
        best === null ||
        distance < Math.abs(best.gaps - wanted) ||
        (distance === Math.abs(best.gaps - wanted) && step > best.step)
      ) {
        best = { step, gaps };
      }
    }
  }

  const { step, gaps } = best ?? { step: 1, gaps: Math.ceil(maxPaise) };
  return Array.from({ length: gaps + 1 }, (_, i) => i * step);
}
