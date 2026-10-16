export type SnakeDirection = 'up' | 'down' | 'left' | 'right';

export interface Point {
  x: number;
  y: number;
}

export type SnakeStepResult = 'moved' | 'ate' | 'crashed' | 'won';

const OPPOSITE: Record<SnakeDirection, SnakeDirection> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left'
};

const DELTA: Record<SnakeDirection, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

export function parseSnakeDirection(input: string): SnakeDirection | null {
  switch (input.toLowerCase().replace('arrow', '')) {
    case 'w':
    case 'up':
      return 'up';
    case 'a':
    case 'left':
      return 'left';
    case 's':
    case 'down':
      return 'down';
    case 'd':
    case 'right':
      return 'right';
    default:
      return null;
  }
}

/** Pure snake rules on a square board; rendering and timing live in the terminal. */
export class SnakeGame {
  body: Point[];
  food: Point | null;
  direction: SnakeDirection = 'right';
  score = 0;

  constructor(
    readonly size = 12,
    private readonly random: () => number = Math.random
  ) {
    const row = Math.floor(size / 2);
    this.body = [
      { x: 2, y: row },
      { x: 1, y: row },
      { x: 0, y: row }
    ];
    this.food = this.placeFood();
  }

  /** Changes direction, ignoring an instant reversal into the snake's own neck. */
  turn(requested: SnakeDirection): void {
    if (this.body.length > 1 && OPPOSITE[this.direction] === requested) {
      return;
    }
    this.direction = requested;
  }

  step(): SnakeStepResult {
    const head = this.body[0];
    const next = { x: head.x + DELTA[this.direction].x, y: head.y + DELTA[this.direction].y };
    const ate = this.food !== null && next.x === this.food.x && next.y === this.food.y;
    // The tail moves away this tick unless the snake grows, so it is not an obstacle.
    const obstacles = ate ? this.body : this.body.slice(0, -1);

    const outOfBounds = next.x < 0 || next.y < 0 || next.x >= this.size || next.y >= this.size;
    if (outOfBounds || obstacles.some((segment) => segment.x === next.x && segment.y === next.y)) {
      return 'crashed';
    }

    this.body = ate ? [next, ...this.body] : [next, ...this.body.slice(0, -1)];
    if (!ate) {
      return 'moved';
    }

    this.score += 1;
    this.food = this.placeFood();
    return this.food === null ? 'won' : 'ate';
  }

  render(): string[] {
    const head = this.body[0];
    const segments = new Set(this.body.map((segment) => `${segment.x}:${segment.y}`));
    const border = `+${'-'.repeat(this.size)}+`;
    const rows = Array.from({ length: this.size }, (_, y) => {
      let row = '|';
      for (let x = 0; x < this.size; x += 1) {
        if (x === head.x && y === head.y) {
          row += '@';
        } else if (this.food && x === this.food.x && y === this.food.y) {
          row += '*';
        } else {
          row += segments.has(`${x}:${y}`) ? 'o' : '.';
        }
      }
      return `${row}|`;
    });
    return [border, ...rows, border];
  }

  private placeFood(): Point | null {
    const occupied = new Set(this.body.map((segment) => `${segment.x}:${segment.y}`));
    const free: Point[] = [];
    for (let y = 0; y < this.size; y += 1) {
      for (let x = 0; x < this.size; x += 1) {
        if (!occupied.has(`${x}:${y}`)) {
          free.push({ x, y });
        }
      }
    }
    return free.length === 0 ? null : free[Math.floor(this.random() * free.length)];
  }
}
