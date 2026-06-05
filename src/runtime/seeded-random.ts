export type SeededRandom = {
  next(): number;
  chance(probability: number): boolean;
};

export function seededRandom(seed: number): SeededRandom {
  let state = seed >>> 0;

  return {
    next() {
      state = (1664525 * state + 1013904223) >>> 0;
      return state / 0x100000000;
    },
    chance(probability) {
      return this.next() < probability;
    },
  };
}
