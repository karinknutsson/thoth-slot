# Thoth Slot

Inspired by a recent trip to Egypt, I created this 5×3 Thoth-themed slot game, built with Pixi.js, TypeScript, and Vite. Thoth is an Egyptian god with the head of an African sacred ibis, who is the god of wisdom, magic and the moon.

## Getting started

```bash
npm install
npm run dev      # start the Vite dev server
npm run build    # type-check (tsc) and build for production
npm run preview  # preview the production build
```

## Project structure

```
src/
  main.ts              # boots Pixi, loads assets, wires everything together
  config/
    GameConfig.ts       # centralized gameplay/behavior tuning values
  data/                 # static game data (plain arrays/objects, no logic)
    symbol-data.ts       # symbol ids, texture keys, RNG weights
    payout-data.ts       # payout multiplier per symbol + match count
    line-data.ts          # payline definitions (which reel/row each line checks)
    paytable-data.ts      # composes the above into one Paytable
    cheat-data.ts          # hand-authored grids for the cheat menu
  types/                # shared interfaces (Symbol, Line, PayoutRule, Win, Paytable)
  models/
    GameStateModel.ts    # balance/bet/phase/total-win state
  services/
    BackendManager.ts    # RNG grid generation + win evaluation (stands in for a real backend)
  controllers/
    SpinController.ts     # orchestrates one spin end-to-end
    AudioController.ts    # music track sequencing, sound effects, volume
    CheatController.ts   # applies a cheat-data grid via the backend
  views/                # all Pixi Container subclasses (rendering + per-frame animation)
    LoadingView.ts, GameView.ts, ReelView.ts, CheatView.ts, AudioView.ts
```

### How a spin flows

1. `main.ts` wires a click on the spin button to `SpinController.spin()`.
2. `SpinController` asks `BackendManager.randomGrid()` for a 5×3 grid (or a forced grid if a cheat is active), starts the reels spinning, and staggers each reel's stop via `ReelView.stopSpin()`.
3. Once settled, `BackendManager.evaluateWins()` checks the grid against every line in the paytable and returns `Win[]` — symbol, match count, payout, and the winning grid positions.
4. `SpinController` plays the appropriate sound(s), pops the winning symbols (`GameView.celebrateWinningSymbols`), and — after a short delay — updates and animates the win total (`GameView.celebrateWin`).

### How I modeled the paytable

I settled on "N-of-a-kind starting from reel 1 of a line," evaluated independently per line in `line-data.ts` — horizontal 3/4/5-wide lines per row, plus a couple of 3-wide diagonals.

### Config and dev tools

`src/config/GameConfig.ts` holds everything I considered actually tunable: economy (starting balance/bet), grid size, responsive breakpoints, spin/win timing. Purely visual constants, like colors/paddings/font sizes stay local to whichever view uses them, since moving those out would just mean jumping between two files to understand one visual effect.

`GameConfig.showCheatMenu` / `showAudioMenu` toggle two dev-only overlays: a cheat menu (top-right) that forces the next grid to a preset from `cheat-data.ts`, and an audio menu (top-left) with music/sound volume sliders.

## What I would do with more time

This was a focused front-end exercise, not a production slot game, so I made some deliberate calls to keep scope in check. Here is where I cut corners, and what I would tackle next:

**Animations are the part I'm least happy with.** The symbols were picked for a visually cohesive style, and having no background, I added a simple squircle with a radial alpha gradient. On winning, there is an inverse squircle added for a glow effect, that grows along with the symbol. For a larger project I would pick and edit the symbols with animations in mind, thinking how they could move and interact with their surroundings. I would also like to make animations spreading over the entire page, maybe shaking and flashing the page on a big win.

**Sound is minimal.** Three effects and two alternating music tracks, each effect just a single `HTMLAudioElement`. Rapid repeated plays restart the sound rather than layering, which is fine for now since nothing fires that fast. Still missing entirely: a spin-start sound, something for the reels while they're spinning, a reel-stop sound, anticipation sounds building into a win, and a real mute toggle visible for the user instead of the hidden volume sliders I have now.

**There is no real backend.** `BackendManager` runs the RNG and win math client-side, purely for convenience. A real money-adjacent slot needs server-side RNG, payout math someone can audit, and a balance that survives a page refresh. Right now there is no persistence at all, so reloading just resets everything.

**No automated tests yet.** Given the payout math is the one thing that most needs to be provably correct, `BackendManager.evaluateWins` is what I would cover first if I added tests.

**No accessibility pass.** It's canvas-only, no keyboard control, no reduced-motion handling, nothing for screen readers.
