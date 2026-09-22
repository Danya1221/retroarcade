import { seedNumber } from "./random.js";
import * as snake from "../games/snake/index.js";
import * as maze from "../games/maze/index.js";
import * as platformer from "../games/platformer/index.js";
import * as mines from "../games/mines/index.js";
import * as merge2048 from "../games/merge2048/index.js";
import * as racer from "../games/racer/index.js";
import * as tanks from "../games/tanks/index.js";
const modules = { snake, maze, platformer, mines, merge2048, racer, tanks };
export const TICK_RATE = 30;
export function createGame(game, seed, level = 1, options = {}) {
  if (!modules[game]) throw Error("Unknown game");
  return modules[game].init(
    {
      game,
      seed,
      level,
      rng: seedNumber(seed),
      tick: 0,
      score: 0,
      secrets: 0,
      boxes: 0,
      over: false,
      won: false,
    },
    options,
  );
}
export function tick(state, input = 0) {
  if (!Number.isInteger(input) || input < 0 || input > 63)
    throw Error("Invalid input");
  if (state.over) return state;
  state.tick++;
  modules[state.game].step(state, input);
  if (state.tick >= 54000) state.over = true;
  return state;
}
export function replay(state, inputs) {
  for (const i of inputs) tick(state, i);
  return state;
}
