/** Utility to zip two lists. */
export function zip<X = unknown, Y = unknown>(xs: X[], ys: Y[]): [X, Y][] {
  return xs.map((x, i) => [x, ys[i]]);
}

/** Sum a bunch of numbers */
export function sum(nums: number[]): number {
  return nums.reduce((acc, num) => acc + num, 0);
}
