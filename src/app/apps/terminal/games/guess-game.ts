export type GuessResult =
  | { kind: 'invalid' }
  | { kind: 'out-of-range' }
  | { kind: 'higher' | 'lower'; attemptsLeft: number }
  | { kind: 'won'; attempts: number }
  | { kind: 'lost'; target: number };

/** "Guess the number" rules: one secret between 1 and `max`, a limited number of attempts. */
export class GuessGame {
  attempts = 0;

  constructor(
    readonly target: number,
    readonly max = 20,
    readonly maxAttempts = 5
  ) {}

  static random(max = 20, maxAttempts = 5): GuessGame {
    return new GuessGame(Math.floor(Math.random() * max) + 1, max, maxAttempts);
  }

  guess(input: string): GuessResult {
    if (!/^\d+$/.test(input.trim())) {
      return { kind: 'invalid' };
    }

    const value = Number(input);
    if (value < 1 || value > this.max) {
      return { kind: 'out-of-range' };
    }

    this.attempts += 1;
    if (value === this.target) {
      return { kind: 'won', attempts: this.attempts };
    }

    const attemptsLeft = this.maxAttempts - this.attempts;
    if (attemptsLeft <= 0) {
      return { kind: 'lost', target: this.target };
    }

    return { kind: value < this.target ? 'higher' : 'lower', attemptsLeft };
  }
}
