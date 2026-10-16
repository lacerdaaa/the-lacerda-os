import { GuessGame } from './guess-game';

describe('GuessGame', () => {
  it('gives hints and wins', () => {
    const game = new GuessGame(7);
    expect(game.guess('3')).toEqual({ kind: 'higher', attemptsLeft: 4 });
    expect(game.guess('9')).toEqual({ kind: 'lower', attemptsLeft: 3 });
    expect(game.guess('7')).toEqual({ kind: 'won', attempts: 3 });
  });

  it('rejects invalid input without spending attempts', () => {
    const game = new GuessGame(7);
    expect(game.guess('abc').kind).toBe('invalid');
    expect(game.guess('50').kind).toBe('out-of-range');
    expect(game.attempts).toBe(0);
  });

  it('loses after the last attempt', () => {
    const game = new GuessGame(7, 20, 2);
    game.guess('1');
    expect(game.guess('2')).toEqual({ kind: 'lost', target: 7 });
  });
});
