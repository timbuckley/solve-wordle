# solve-wordle

## Goal

Seeks optimal guessing strategy using letter frequency analysis on all remaining viable words as incoming guess/score combinations shrinks corpus. Initial `solutions` corpus ripped out of the wordle website code.

## Installation

```sh
yarn install
yarn global add ts-node # To use the TypeScript REPL
```

## Usage
In a `ts-node` REPL:

```ts
import {WorldeSolver} from '.'; var s = new WordleSolver();

// Guesses and their scoring can be chained together statefully to shrink down the corpus as scores are appended.
// Scores are 5-letter strings of `x` for an exact match, `i` for a letter to be included, and `e` for letters to be excluded.

s.score('irate', 'eeeee').score('lousy', 'ixiee').getBestGuess()
// Returns 'mogul'. Or, just omit `.getBestGuess()` to see the reduced `corpus` over time.
```

## Future work

Best starting word is along the lines of: `irate`, `later`, or possibly `adieu`. Full analysis would require comparing different solve strategies with different solving words across the corpus of target words. This is left as an exercise to the reader.

