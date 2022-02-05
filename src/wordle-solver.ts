// Create a large array of 5-letter words in a words.json array like so { "solutions": [...] }
import { solutions } from "../words.json";
import { sum, zip } from "./utils";

/**
 * Solves Wordle in as few tries as possible.
 *
 * @example
 *  const solver = new WordleSolver(optionalStartingList);
 *
 *  // User enters 'later', gets a score of [grey, grey, hit, misplaced, misplaced]:
 *  solver.score('later', 'eexii').getBestGuess();
 *  // =>
 *
 *  // Start again.
 *  solver.reset();
 *
 * @note Current average is just under 5 attempts across all test words.
 *       While most are solved in 2 attempts, there are some where it gets stuck with similar words.
 *
 * @note A class was chosen over a function because it's most efficent to mutate the corpus.
 */
export class WordleSolver {
  corpus: string[];
  startingWord?: string;
  guessesAndScores: [string, string][];
  logging: boolean;
  guessLength: number;

  constructor(
    corpus: string[] = solutions,
    startingWord: string | null = null,
    logging: boolean = false
  ) {
    this.guessLength = 5;
    this.logging = logging;
    this.reset(corpus);
    this.sort();
    this.startingWord = startingWord ?? this.getSolutions()[0] ?? null;
  }

  getBestGuess(): string | null {
    if (!this.guessesAndScores.length) return this.startingWord;
    const solutions = this.getSolutions();
    return solutions[0] ?? null;
  }

  reset(corpus: string[] = solutions) {
    this.corpus = corpus.slice();
    this.guessesAndScores = [];
    return this;
  }

  sort() {
    this.sortByCommonness();
    return this;
  }

  getSolutions() {
    this.sort();
    return this.corpus;
  }

  /**Score like 'x' for correct, 'e' for excluded, 'i' for included */
  score(guess: string, score: string) {
    const lenErrorMessage = `must be ${this.guessLength} letters long.`;
    if (guess.length !== this.guessLength)
      throw new Error(`Guess ${lenErrorMessage}`);
    if (score.length !== this.guessLength)
      throw new Error(`Score ${lenErrorMessage}`);
    const loweredScore = score.toLowerCase();

    const invalidScoreLetters = score
      .split("")
      .filter((l) => l !== "x" && l !== "e" && l !== "i");
    if (invalidScoreLetters.length)
      throw new Error(
        `Invalid score letters: ${invalidScoreLetters.join(", ")}`
      );

    this.guessesAndScores.push([guess, loweredScore]);

    const guessAndScore: [string, string][] = zip(
      guess.split(""),
      loweredScore.split("")
    );

    const duplicateLetters = new Set(
      guess
        .split("")
        .filter((letter, index) => guess.slice(index + 1).includes(letter))
    );

    // Remove misses.
    const misses: string[] = guessAndScore
      .filter(
        ([guessLetter, scoreLetter]) =>
          scoreLetter === "e" && !duplicateLetters.has(guessLetter)
      )
      .map(([guessLetter]) => guessLetter);
    this.excludeLetters(misses.join(""));

    guessAndScore.forEach(([guessLetter, scoreLetter], index) => {
      switch (scoreLetter) {
        case "x":
          // Keep words w/ hits.
          return this.keepWithCorrectLetter(guessLetter, index);
        case "i":
          // Keep words w/ misplaced hits.
          return this.keepWithMisplacedLetter(guessLetter, index);
        case "e":
          // Remove words w/ incorrect letters.
          return this.excludeWithLetter(guessLetter, index);
      }
    });

    this.sort();

    return this;
  }

  /** Return an array of second guesses, which prefer to reduce overlap with prior guesses. */
  getSecondGuess() {
    // Don't have a better guess to make if no prior guesses.
    if (this.guessesAndScores.length === 0) return this.corpus;

    const currentWords = this.corpus.slice();
    const [priorGuess, priorGuessScore] =
      this.guessesAndScores[this.guessesAndScores.length - 1];

    // Exclude inclusions as well as misses.
    const startingWords = currentWords.filter((word) =>
      word
        .split("")
        .every(
          (letter, index) =>
            priorGuessScore[index] === "x" || letter !== priorGuess[index]
        )
    );
    const solver = new WordleSolver(startingWords);
    return solver.getSolutions();
  }

  /** Remove words that contain provided letters. */
  excludeLetters(lettersToExclude: string) {
    const excludedLetters = new Set(lettersToExclude.split(""));
    const newCorpus = this.corpus.filter((word) =>
      word.split("").every((letter) => !excludedLetters.has(letter))
    );
    this.logging &&
      console.log(
        `Dropped ${
          this.corpus.length - newCorpus.length
        } words with excluded letters.`
      );
    this.corpus = newCorpus;
    return this;
  }

  /** Keep only words without the given letter at a specific index. */
  excludeWithLetter(wrongLetter: string, index: number) {
    const newCorpus = this.corpus.filter((word) => word[index] !== wrongLetter);
    this.logging &&
      console.log(
        `Dropped ${
          this.corpus.length - newCorpus.length
        } words with wrong letter.`
      );
    this.corpus = newCorpus;
    return this;
  }

  /** Keep only words with given letter at a specific index. */
  keepWithCorrectLetter(correctLetter: string, index: number) {
    const newCorpus = this.corpus.filter(
      (word) => word[index] === correctLetter
    );
    this.logging &&
      console.log(
        `Dropped ${
          this.corpus.length - newCorpus.length
        } words with correct letter.`
      );
    this.corpus = newCorpus;
    return this;
  }

  /** Keep only words with given letter at a place OTHER than the index. */
  keepWithMisplacedLetter(misplacedLetter: string, index: number) {
    const newCorpus = this.corpus.filter(
      (word) =>
        word[index] !== misplacedLetter && word.includes(misplacedLetter)
    );
    this.logging &&
      console.log(
        `Dropped ${
          this.corpus.length - newCorpus.length
        } words with misplaced letter.`
      );
    this.corpus = newCorpus;
    return this;
  }

  /**
   * Returns letterFrequency given current solution space.
   *
   * If an `atIndex` is provided, returns the letter frequency at that index only.
   */
  letterFrequency(atIndex: number | null = null) {
    const letterFreq: Record<string, number> = {};
    this.corpus.forEach((word) => {
      word.split("").forEach((letter, index) => {
        if (atIndex !== null && atIndex !== index) return;

        if (!letterFreq[letter]) letterFreq[letter] = 1;
        letterFreq[letter]++;
      });
    });
    const bestLetters = Object.entries(letterFreq)
      .sort(([, aFreq], [, bFreq]) => bFreq - aFreq)
      .map(([letter]) => letter)
      .join("");
    this.logging && console.log("Most frequent letters: ", bestLetters);
    return letterFreq;
  }

  bestLetters(frequencyMap?: Record<string, number>) {
    const letterFreq = frequencyMap ?? this.letterFrequency();
    const bestLetters = Object.entries(letterFreq)
      .sort(([, aFreq], [, bFreq]) => bFreq - aFreq)
      .map(([letter]) => letter)
      .join("");
    return bestLetters;
  }

  /** Returns letterFrequency of a given word for the current solution space. */
  letterFrequencyScore(word: string) {
    const letterFreq = this.letterFrequency();
    return word.split("").reduce((acc, letter) => acc + letterFreq[letter], 0);
  }

  /** Sorts solutions by common-ness of its letters amongst other solutions. */
  private sortByCommonness() {
    const letterFreq = this.letterFrequency();

    const byFrequency = (a: string, b: string) => {
      // Prefer words with non-repeating letters.
      const aUniqs = new Set(a).size;
      const bUniqs = new Set(b).size;
      const differenceOfUniqueness = bUniqs - aUniqs;
      if (differenceOfUniqueness !== 0) return differenceOfUniqueness;

      // Prefer words with more frequently-occuring letters.
      const aFreq = a
        .split("")
        .reduce((acc, letter) => acc + letterFreq[letter], 0);
      const bFreq = b
        .split("")
        .reduce((acc, letter) => acc + letterFreq[letter], 0);
      return bFreq - aFreq;
    };
    this.corpus.sort(byFrequency);
    return this;
  }

  /*
   * Show positions by the most common frequency per position, of those known.
   */
  bestLetterPositions() {
    const solutions = this.getSolutions();

    let result = [];
    for (let index = 0; index < this.guessLength; index++) {
      result.push(this.bestLetters(this.letterFrequency(index)));
    }
    return result;
  }
}

// === Testing ===

/** Score the guess, given the targetWord. */
export function scoreGuess(guess: string, targetWord: string): string {
  return zip(guess.split(""), targetWord.split(""))
    .map(([letter, targetLetter]) => {
      if (letter === targetLetter) return "x";
      if (targetWord.includes(letter)) return "i";
      return "e";
    })
    .join("");
}

/** Play a wordle until a solution is found. */
export function playRound(
  targetWord: string,
  startingWord: string | null,
  logging: boolean = false
): {
  attempts: number;
  firstGuess: string;
  targetWord: string;
  scores: string[];
  guesses: string[];
} {
  let solver = new WordleSolver(undefined, startingWord);
  let attempts = 0;
  let guesses = [];
  let scores = [];
  let myGuess = solver.getBestGuess();
  let myScore = scoreGuess(myGuess, targetWord);
  const firstGuess = myGuess;

  const solvedScore: string = Array(solver.guessLength).fill("x").join("");

  while (myScore !== solvedScore) {
    // prior guess
    const priorGuess = myGuess;
    // Determine best guess
    myGuess = solver.getBestGuess();
    guesses.push(myGuess);
    if (!myGuess)
      throw new Error(
        `No more guesses after ${priorGuess} for target ${targetWord}`
      );
    // See the score for the guess.
    myScore = scoreGuess(myGuess, targetWord);
    scores.push(myScore);
    // Enter this score into the system.
    solver.score(myGuess, myScore);
    attempts++;
  }
  logging && console.log(`Found ${targetWord} in ${attempts} attempts.`);
  return { attempts, targetWord, firstGuess, guesses, scores };
}

export function scoresInColors(scores: string[]) {
  return scores
    .map((score) => score.split("").map(myScoreToSquare).join(""))
    .join("\n");
}

function myScoreToSquare(scoreLetter: "e" | "i" | "x") {
  switch (scoreLetter) {
    case "e":
      return "⬛";
    case "i":
      return "🟨";
    case "x":
      return "🟩";
  }
}
