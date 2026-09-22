export function random(state) {
  let x = state.rng | 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  state.rng = x >>> 0;
  return state.rng / 4294967296;
}
export function seedNumber(seed) {
  let h = 2166136261;
  for (const c of String(seed)) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0 || 1;
}
export const directions = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];
export const INPUT = {
  UP: 1,
  RIGHT: 2,
  DOWN: 4,
  LEFT: 8,
  JUMP: 16,
  ACTION: 32,
};
export function direction(input) {
  return input & 1 ? 0 : input & 2 ? 1 : input & 4 ? 2 : input & 8 ? 3 : -1;
}
export function same(a, b) {
  return a.x === b.x && a.y === b.y;
}
