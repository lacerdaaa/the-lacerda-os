import { inject, Injectable, signal } from '@angular/core';
import { AppId, APPS } from '../../core/apps';
import { DESKTOP_THEMES, DesktopService, DesktopTheme } from '../../core/desktop.service';
import { format, I18nService } from '../../core/i18n';
import { ShellService } from '../../core/shell.service';
import { DESKTOP_ITEMS } from '../../data/desktop';
import { FILES, findFile } from '../../data/files';
import { GuessGame } from './games/guess-game';
import { parseSnakeDirection, SnakeDirection, SnakeGame } from './games/snake-game';
import { TERMINAL_COPY } from './terminal.copy';

type CopyKey = keyof typeof TERMINAL_COPY;
type CommandHandler = (args: string) => void;

export const TERMINAL_PROMPT = 'eduardo@lacOs:~$';
const VIRTUAL_PATH = '/Users/eduardo/Desktop';
const MAX_LINES = 200;
const MAX_HISTORY = 40;
const SNAKE_TICK_MS = 380;
const QUIT_WORDS = new Set(['quit', 'exit', 'q', 'sair', 'desisto']);

/** Apps that can be opened by typing their name (`projects`) or `open <name>`. */
const APP_ALIASES: Record<string, AppId> = {
  about: 'about',
  sobre: 'about',
  finder: 'finder',
  projects: 'projects',
  projetos: 'projects',
  books: 'books',
  livros: 'books',
  courses: 'courses',
  cursos: 'courses',
  experience: 'experience',
  experiencia: 'experience',
  quiz: 'quiz',
  safari: 'safari',
  blog: 'blog',
  notes: 'notes',
  notas: 'notes',
  terminal: 'terminal',
  text: 'textviewer',
  textviewer: 'textviewer',
  simpletext: 'textviewer'
};

/** Command interpreter behind Terminal.app. Lives as a service so the session survives closing the window. */
@Injectable({ providedIn: 'root' })
export class TerminalService {
  private readonly i18n = inject(I18nService);
  private readonly shell = inject(ShellService);
  private readonly desktop = inject(DesktopService);

  private readonly linesState = signal<string[]>(this.bannerLines());
  private readonly snakeBoardState = signal<string[] | null>(null);
  private readonly inputState = signal('');

  readonly lines = this.linesState.asReadonly();
  readonly snakeBoard = this.snakeBoardState.asReadonly();
  readonly input = this.inputState.asReadonly();

  private history: string[] = [];
  private historyIndex = -1;
  private draftInput = '';

  private guess: GuessGame | null = null;
  private snake: SnakeGame | null = null;
  private snakeTimer: number | null = null;
  readonly score = { guessWins: 0, guessLosses: 0, snakeWins: 0, snakeLosses: 0, snakeBest: 0 };

  private readonly commands: Record<string, CommandHandler> = {
    help: () => this.printHelp(),
    ajuda: () => this.printHelp(),
    ls: () => this.printListing(),
    dir: () => this.printListing(),
    cat: (args) => this.printFile(args),
    type: (args) => this.printFile(args),
    open: (args) => this.openFromArgs(args),
    theme: (args) => this.setTheme(args),
    lang: (args) => this.setLanguage(args),
    whoami: () => this.print(['eduardo']),
    uname: () => this.print(['lacOs 8.6 (PowerPC G3, virtual)']),
    pwd: () => this.print([VIRTUAL_PATH]),
    date: () => this.print([new Date().toLocaleString(this.i18n.language())]),
    echo: (args) => this.print([args]),
    history: () => this.printHistory(),
    neofetch: () => this.printNeofetch(),
    sudo: () => this.print([this.t('sudo')]),
    guess: () => this.startGuess(),
    jogo: () => this.startGuess(),
    score: () => this.printScores(),
    placar: () => this.printScores(),
    snake: () => this.startSnake(),
    cobrinha: () => this.startSnake(),
    'snake-score': () => this.printScores(),
    boot: (args) => this.founderBoot(args),
    clear: () => this.clear(),
    cls: () => this.clear()
  };

  setInput(value: string): void {
    this.inputState.set(value);
  }

  submit(): void {
    const command = this.inputState().trim();
    if (!command) {
      return;
    }

    this.print([`${TERMINAL_PROMPT} ${command}`]);
    if (this.history[this.history.length - 1] !== command) {
      this.history = [...this.history, command].slice(-MAX_HISTORY);
    }
    this.historyIndex = -1;
    this.draftInput = '';
    this.inputState.set('');
    this.run(command);
  }

  run(rawCommand: string): void {
    const command = rawCommand.trim();
    if (!command || this.handleGuessInput(command) || this.handleSnakeInput(command)) {
      return;
    }

    const [keywordToken] = command.split(/\s+/);
    const keyword = keywordToken.toLowerCase();
    const args = command.slice(keywordToken.length).trim();

    const handler = this.commands[keyword];
    if (handler) {
      handler(args);
    } else if (APP_ALIASES[keyword]) {
      this.launch(APP_ALIASES[keyword]);
    } else {
      this.print([this.t('notFound', { command })]);
    }
  }

  /** Handles keys the plain text input cannot: history, snake steering and Ctrl+L. */
  handleKey(event: KeyboardEvent): void {
    if (this.snake) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.endSnake('quit');
        return;
      }
      // Arrows and w/a/s/d steer immediately, without pressing Enter.
      const direction = parseSnakeDirection(event.key);
      if (direction && (event.key.startsWith('Arrow') || event.key.length === 1)) {
        event.preventDefault();
        this.steerSnake(direction);
        return;
      }
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.navigateHistory(event.key === 'ArrowUp');
    } else if (event.ctrlKey && event.key.toLowerCase() === 'l') {
      event.preventDefault();
      this.clear();
    }
  }

  steerSnake(direction: SnakeDirection): void {
    this.snake?.turn(direction);
  }

  isSnakeRunning(): boolean {
    return this.snake !== null;
  }

  print(lines: string[]): void {
    this.linesState.update((current) => [...current, ...lines].slice(-MAX_LINES));
  }

  announceFounderSecret(): void {
    this.print([this.t('secretLine1'), this.t('secretLine2'), this.t('secretLine3')]);
  }

  /** Stops anything running in the background, e.g. when the window closes. */
  suspend(): void {
    if (this.snake) {
      this.endSnake('quit');
    }
  }

  private t(key: CopyKey, params?: Record<string, string | number>): string {
    return format(this.i18n.pick(TERMINAL_COPY[key]), params);
  }

  private bannerLines(): string[] {
    return [this.t('banner1'), this.t('banner2'), this.t('banner3')];
  }

  private clear(): void {
    this.suspend();
    this.linesState.set([]);
  }

  private launch(appId: AppId): void {
    this.shell.openApp(appId);
    this.print([this.t('launching', { app: this.shell.appName(appId) })]);
  }

  private openFromArgs(args: string): void {
    const appNames = Object.keys(APPS).join('|');
    if (!args) {
      this.print([this.t('openUsage', { apps: appNames })]);
      return;
    }

    const target = args.split(/\s+/)[0].toLowerCase();
    const file = findFile(target);
    if (file) {
      this.shell.openFile(file.id);
      this.print([this.t('launching', { app: file.id })]);
      return;
    }

    const appId = APP_ALIASES[target];
    if (appId) {
      this.launch(appId);
    } else {
      this.print([this.t('unknownApp', { app: args }), this.t('openUsage', { apps: appNames })]);
    }
  }

  private printHelp(): void {
    const row = (command: string, description: string) => `  ${command.padEnd(22)}${description}`;
    const lines = [
      this.t('helpTitle'),
      row('about | projects | ...', this.t('helpApps')),
      row('open <app|file>', this.t('helpOpen')),
      row('ls', this.t('helpLs')),
      row('cat <file>', this.t('helpCat')),
      row('theme <name>', this.t('helpTheme')),
      row('lang <en|pt>', this.t('helpLang')),
      row('guess | snake', this.t('helpGames')),
      row('score', this.t('helpScore')),
      row('neofetch | uname', this.t('helpSystem')),
      row('whoami | pwd | date | echo | history', ''),
      row('', this.t('helpMisc')),
      row('clear', this.t('helpClear'))
    ];
    if (this.desktop.founderUnlocked()) {
      lines.push(row('boot --founder', this.t('helpBoot')));
    }
    this.print(lines);
  }

  private printListing(): void {
    const entries = DESKTOP_ITEMS.map((item) => (item.kind === 'app' ? `${this.shell.appName(item.appId)}.app` : item.fileId));
    this.print([`${VIRTUAL_PATH}:`, entries.join('  ')]);
  }

  private printFile(name: string): void {
    if (!name) {
      this.print([this.t('catUsage'), `  ${Object.keys(FILES).join('  ')}`]);
      return;
    }

    const file = findFile(name);
    if (!file) {
      this.print([this.t('noSuchFile', { file: name })]);
      return;
    }
    this.print([`--- ${file.id} ---`, file.content(this.i18n.language())]);
  }

  private setTheme(args: string): void {
    const theme = args.toLowerCase() as DesktopTheme;
    const available = this.desktop.availableThemes();
    if (!available.includes(theme)) {
      this.print([this.t('themeUsage', { themes: available.join('|') })]);
      return;
    }
    this.desktop.setTheme(theme);
    this.print([this.t('themeSet', { theme })]);
  }

  private setLanguage(args: string): void {
    const value = args.toLowerCase();
    if (value !== 'en' && value !== 'pt') {
      this.print([this.t('langUsage')]);
      return;
    }
    this.i18n.setLanguage(value === 'pt' ? 'pt-BR' : 'en-US');
    this.print([this.t('langSet')]);
  }

  private printHistory(): void {
    if (this.history.length === 0) {
      this.print([this.t('noHistory')]);
      return;
    }
    const visible = this.history.slice(-12);
    const offset = this.history.length - visible.length + 1;
    this.print(visible.map((command, index) => `${String(offset + index).padStart(4)}  ${command}`));
  }

  private printNeofetch(): void {
    const theme = this.desktop.theme();
    this.print([
      '   .--.      eduardo@lacOs',
      '  |o_o |     -------------',
      `  |:_/ |     OS: lacOs 8.6`,
      ' //   \\ \\    Kernel: angular (zoneless)',
      '(|     | )   Shell: retrosh 0.9',
      `/'\\_   _/\`\\  Theme: ${theme} (${DESKTOP_THEMES.length} available)`,
      '\\___)=(___/  Resolution: 4:3 CRT'
    ]);
  }

  private printScores(): void {
    const { guessWins, guessLosses, snakeWins, snakeLosses, snakeBest } = this.score;
    this.print([
      this.t('guessScore', { wins: guessWins, losses: guessLosses }),
      this.t('snakeScore', { wins: snakeWins, losses: snakeLosses, best: snakeBest })
    ]);
  }

  private founderBoot(args: string): void {
    if (args !== '--founder') {
      this.print([this.t('bootUsage')]);
      return;
    }
    if (!this.desktop.founderUnlocked()) {
      this.print([this.t('bootLocked'), this.t('bootTip')]);
      return;
    }

    this.desktop.setTheme('founder');
    this.print([
      'lacOs Founder Boot v1.0',
      'Reading founder profile................... OK',
      'Linking purpose modules................... OK',
      'Loading respect, craft and consistency.... OK',
      this.t('bootWelcome')
    ]);
  }

  // --- Guess the number ---------------------------------------------------

  private startGuess(): void {
    this.suspend();
    this.guess = GuessGame.random();
    this.print([this.t('guessStart'), this.t('guessRules', { max: this.guess.max, attempts: this.guess.maxAttempts })]);
  }

  /** Returns true when the input was consumed by a running guess game. */
  private handleGuessInput(input: string): boolean {
    const game = this.guess;
    if (!game) {
      return false;
    }

    if (QUIT_WORDS.has(input.toLowerCase())) {
      this.guess = null;
      this.score.guessLosses += 1;
      this.print([this.t('guessQuit')]);
      return true;
    }

    const result = game.guess(input);
    switch (result.kind) {
      case 'invalid':
        this.print([this.t('guessInvalid', { max: game.max })]);
        break;
      case 'out-of-range':
        this.print([this.t('guessRange', { max: game.max })]);
        break;
      case 'higher':
      case 'lower':
        this.print([this.t(result.kind === 'higher' ? 'guessHigher' : 'guessLower', { left: result.attemptsLeft })]);
        break;
      case 'won':
        this.guess = null;
        this.score.guessWins += 1;
        this.print([this.t('guessWon', { attempts: result.attempts }), this.t('guessAgain')]);
        break;
      case 'lost':
        this.guess = null;
        this.score.guessLosses += 1;
        this.print([this.t('guessLost', { target: result.target }), this.t('guessAgain')]);
        break;
    }
    return true;
  }

  // --- Snake --------------------------------------------------------------

  private startSnake(): void {
    this.suspend();
    this.guess = null;
    this.snake = new SnakeGame();
    this.print([this.t('snakeStart'), this.t('snakeControls')]);
    this.renderSnake();
    this.snakeTimer = window.setInterval(() => this.tickSnake(), SNAKE_TICK_MS);
  }

  /** Advances the snake one cell. Public for deterministic tests. */
  tickSnake(): void {
    if (!this.snake) {
      return;
    }

    const result = this.snake.step();
    if (result === 'crashed') {
      this.endSnake('loss');
    } else if (result === 'won') {
      this.endSnake('win');
    } else {
      this.renderSnake();
    }
  }

  /** Returns true when the input was consumed by a running snake game. */
  private handleSnakeInput(input: string): boolean {
    if (!this.snake) {
      return false;
    }

    const normalized = input.toLowerCase();
    if (QUIT_WORDS.has(normalized)) {
      this.endSnake('quit');
      return true;
    }

    const direction = parseSnakeDirection(normalized);
    if (direction) {
      this.steerSnake(direction);
      return true;
    }

    if (normalized === 'help') {
      this.print([this.t('snakeHelp')]);
      return true;
    }
    return false;
  }

  private renderSnake(): void {
    if (!this.snake) {
      return;
    }
    this.snakeBoardState.set([
      this.t('snakeStatus', { score: this.snake.score, best: this.score.snakeBest }),
      ...this.snake.render()
    ]);
  }

  private endSnake(result: 'win' | 'loss' | 'quit'): void {
    const game = this.snake;
    if (!game) {
      return;
    }

    if (this.snakeTimer !== null) {
      window.clearInterval(this.snakeTimer);
      this.snakeTimer = null;
    }
    this.snake = null;
    this.snakeBoardState.set(null);
    this.score.snakeBest = Math.max(this.score.snakeBest, game.score);

    if (result === 'win') {
      this.score.snakeWins += 1;
      this.print([this.t('snakeWon', { score: game.score }), this.t('snakeAgain')]);
    } else if (result === 'loss') {
      this.score.snakeLosses += 1;
      this.print([this.t('snakeCrashed', { score: game.score }), this.t('snakeAgain')]);
    } else {
      this.print([this.t('snakeQuit')]);
    }
  }

  private navigateHistory(previous: boolean): void {
    const total = this.history.length;
    if (total === 0) {
      return;
    }

    if (previous) {
      if (this.historyIndex === -1) {
        this.draftInput = this.inputState();
      }
      this.historyIndex = Math.min(this.historyIndex + 1, total - 1);
    } else {
      if (this.historyIndex === -1) {
        return;
      }
      this.historyIndex -= 1;
      if (this.historyIndex === -1) {
        this.inputState.set(this.draftInput);
        return;
      }
    }

    this.inputState.set(this.history[total - 1 - this.historyIndex] ?? '');
  }
}
