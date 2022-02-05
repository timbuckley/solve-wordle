import { solutions } from "../words.json";
import { playRound, sum } from "../src";

/**
 * Test the solver by running it through every word in corpus
 */
export function testSolver(
  startingWord: string | null = null,
  logging: boolean = false
) {
  const plays = solutions
    .map((testWord) => playRound(testWord, startingWord, logging))
    .sort((a, b) => a.attempts - b.attempts);

  const allAttempts = plays.map(({ attempts }) => attempts);
  const averageAttempts = sum(allAttempts) / allAttempts.length;

  const maxAttempts = Math.max(...allAttempts);
  const minAttempts = Math.min(...allAttempts);

  const worstAttempts = plays
    .reverse()
    .slice(0, 9)
    .map(({ targetWord }) => playRound(targetWord, startingWord, true));

  return { averageAttempts, minAttempts, maxAttempts, worstAttempts };
}

export function optimalStartingWord() {
  return solutions.map((startingWord) => {
    console.log(`Perf check, starting with ${startingWord}`);
    return testSolver(startingWord, false);
  });
}
