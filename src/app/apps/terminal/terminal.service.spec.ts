import { TestBed } from '@angular/core/testing';
import { DesktopService } from '../../core/desktop.service';
import { I18nService } from '../../core/i18n';
import { WindowManagerService } from '../../core/window-manager.service';
import { GuessGame } from './games/guess-game';
import { TerminalService } from './terminal.service';

describe('TerminalService', () => {
  let terminal: TerminalService;
  const log = () => terminal.lines().join('\n');

  beforeEach(() => {
    localStorage.clear();
    TestBed.inject(I18nService).setLanguage('en-US');
    terminal = TestBed.inject(TerminalService);
  });

  afterEach(() => terminal.suspend());

  it('opens apps by name and with open <app>', () => {
    const windows = TestBed.inject(WindowManagerService);
    terminal.run('open notes');
    terminal.run('projects');
    expect(windows.isRunning('notes')).toBe(true);
    expect(windows.isRunning('projects')).toBe(true);
  });

  it('opens desktop files with open <file>', () => {
    terminal.run('open readme.txt');
    expect(TestBed.inject(WindowManagerService).findByApp('textviewer')?.title).toBe('readme.txt');
  });

  it('navigates command history with the arrow keys', () => {
    const key = (name: string) => ({ key: name, ctrlKey: false, preventDefault: () => undefined }) as KeyboardEvent;
    terminal.setInput('whoami');
    terminal.submit();
    terminal.setInput('pwd');
    terminal.submit();

    terminal.handleKey(key('ArrowUp'));
    expect(terminal.input()).toBe('pwd');
    terminal.handleKey(key('ArrowUp'));
    expect(terminal.input()).toBe('whoami');
    terminal.handleKey(key('ArrowDown'));
    expect(terminal.input()).toBe('pwd');
  });

  it('prints files with cat', () => {
    terminal.run('cat about-me.txt');
    expect(log()).toContain('--- about-me.txt ---');
    expect(log()).toContain('Eduardo Lacerda');

    terminal.run('cat nope.txt');
    expect(log()).toContain('No such file');
  });

  it('reports unknown commands', () => {
    terminal.run('rm -rf /');
    expect(log()).toContain('command not found: rm -rf /');
  });

  it('plays the guess game and keeps score', () => {
    terminal.run('guess');
    (terminal as unknown as { guess: GuessGame }).guess = new GuessGame(7);
    terminal.run('7');
    terminal.run('score');
    expect(log()).toContain('You got it in 1 attempt(s)');
    expect(log()).toContain('wins: 1');
  });

  it('runs snake until it crashes', () => {
    terminal.run('snake');
    expect(terminal.snakeBoard()).not.toBeNull();
    for (let tick = 0; tick < 20; tick += 1) {
      terminal.tickSnake();
    }
    expect(terminal.snakeBoard()).toBeNull();
    expect(terminal.score.snakeLosses).toBe(1);
    expect(log()).toContain('Game over');
  });

  it('changes theme and language', () => {
    terminal.run('theme grid');
    expect(TestBed.inject(DesktopService).theme()).toBe('grid');
    terminal.run('lang pt');
    expect(TestBed.inject(I18nService).language()).toBe('pt-BR');
  });

  it('runs the founder boot only after the secret is unlocked', () => {
    terminal.run('boot --founder');
    expect(log()).toContain('founder profile is locked');

    TestBed.inject(DesktopService).unlockFounderSecret();
    terminal.run('boot --founder');
    expect(log()).toContain('lacOs Founder Boot v1.0');
  });
});
