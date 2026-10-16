import { parseSnakeDirection, SnakeGame } from './snake-game';

describe('SnakeGame', () => {
  it('grows and scores after eating food', () => {
    const game = new SnakeGame(12, () => 0);
    game.body = [{ x: 1, y: 1 }, { x: 0, y: 1 }];
    game.food = { x: 2, y: 1 };

    expect(game.step()).toBe('ate');
    expect(game.score).toBe(1);
    expect(game.body.length).toBe(3);
  });

  it('crashes into walls', () => {
    const game = new SnakeGame();
    game.body = [{ x: 11, y: 0 }];
    game.food = { x: 0, y: 5 };
    expect(game.step()).toBe('crashed');
  });

  it('ignores reversing into its own neck', () => {
    const game = new SnakeGame();
    game.turn('left');
    expect(game.direction).toBe('right');
    game.turn('up');
    expect(game.direction).toBe('up');
  });

  it('may move into the cell its tail is leaving', () => {
    const game = new SnakeGame();
    game.body = [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 1, y: 2 }];
    game.food = { x: 9, y: 9 };
    game.direction = 'down';
    expect(game.step()).toBe('moved');
  });

  it('renders the board with head, body and food', () => {
    const game = new SnakeGame(4, () => 0);
    game.body = [{ x: 1, y: 0 }, { x: 0, y: 0 }];
    game.food = { x: 3, y: 3 };
    expect(game.render()).toEqual(['+----+', '|o@..|', '|....|', '|....|', '|...*|', '+----+']);
  });

  it('parses keys and words into directions', () => {
    expect(parseSnakeDirection('ArrowUp')).toBe('up');
    expect(parseSnakeDirection('a')).toBe('left');
    expect(parseSnakeDirection('x')).toBeNull();
  });
});
