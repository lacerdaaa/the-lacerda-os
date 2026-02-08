import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    app.skipBootSequence();
    expect(app).toBeTruthy();
  });

  it('should show boot overlay on startup', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.boot-overlay')).toBeTruthy();
  });

  it('should hide boot overlay when skipped', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    app.skipBootSequence();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.boot-overlay')).toBeFalsy();
  });

  it('should render the desktop shell title', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    app.skipBootSequence();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('about me');
  });

  it('should show at least one window', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    app.skipBootSequence();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.window').length).toBeGreaterThan(0);
  });

  it('should render workspace items', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    app.skipBootSequence();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.workspace-item').length).toBeGreaterThan(0);
  });

  it('should open apps from terminal commands', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    app.skipBootSequence();

    app.runTerminalCommand('open notes');

    const windows = app.windows();
    expect(windows.some((windowState: { appId: string }) => windowState.appId === 'notes')).toBe(true);
  });

  it('should navigate terminal command history with arrow keys', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    app.skipBootSequence();

    app.terminalInput.set('about');
    app.submitTerminalCommand();
    app.terminalInput.set('projects');
    app.submitTerminalCommand();

    app.onTerminalKeydown({
      key: 'ArrowUp',
      preventDefault: () => undefined
    } as KeyboardEvent);
    expect(app.terminalInput()).toBe('projects');

    app.onTerminalKeydown({
      key: 'ArrowUp',
      preventDefault: () => undefined
    } as KeyboardEvent);
    expect(app.terminalInput()).toBe('about');

    app.onTerminalKeydown({
      key: 'ArrowDown',
      preventDefault: () => undefined
    } as KeyboardEvent);
    expect(app.terminalInput()).toBe('projects');
  });

  it('should print workspace text file content with cat command', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    app.skipBootSequence();

    app.runTerminalCommand('cat about-me.txt');

    const terminalLog = app.terminalLines().join('\n');
    expect(terminalLog).toContain('--- about-me.txt ---');
    expect(terminalLog).toContain('Eduardo Lacerda');
  });

  it('should play and win the terminal guess game', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    app.skipBootSequence();

    app.runTerminalCommand('guess');
    app.terminalGuessTarget = 7;
    app.runTerminalCommand('7');

    const terminalLog = app.terminalLines().join('\n');
    expect(terminalLog).toContain('Guess game iniciado.');
    expect(terminalLog).toContain('Boa! Acertou');
    expect(app.terminalGuessTarget).toBeNull();
    expect(app.terminalGuessWins).toBe(1);
  });

  it('should show guess game score', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    app.skipBootSequence();

    app.terminalGuessWins = 2;
    app.terminalGuessLosses = 1;
    app.runTerminalCommand('placar');

    const terminalLog = app.terminalLines().join('\n');
    expect(terminalLog).toContain('vitorias: 2');
    expect(terminalLog).toContain('derrotas: 1');
  });

  it('should play snake and grow after eating food', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    app.skipBootSequence();

    app.runTerminalCommand('snake');
    app.terminalSnakeBody = [{ x: 1, y: 1 }, { x: 0, y: 1 }];
    app.terminalSnakeDirection = 'right';
    app.terminalSnakeFood = { x: 2, y: 1 };
    app.terminalSnakeScore = 0;

    app.runTerminalCommand('d');
    app.advanceSnake();

    expect(app.terminalSnakeScore).toBe(1);
    expect(app.terminalSnakeBody.length).toBe(3);
    expect(app.terminalSnakeBoard()).toBeTruthy();
    app.stopSnakeTicker();
  });

  it('should end snake game on wall collision', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    app.skipBootSequence();

    app.runTerminalCommand('snake');
    app.terminalSnakeBody = [{ x: 11, y: 0 }];
    app.terminalSnakeDirection = 'right';
    app.terminalSnakeFood = { x: 0, y: 0 };
    app.terminalSnakeScore = 2;

    app.advanceSnake();

    expect(app.terminalSnakeBody).toBeNull();
    expect(app.terminalSnakeLosses).toBe(1);
    expect(app.terminalSnakeBestScore).toBe(2);
    expect(app.terminalSnakeBoard()).toBeNull();
  });

  it('should minimize and reopen windows', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    app.skipBootSequence();

    app.openApp('notes');
    const notesWindow = app.windows().find((windowState: { appId: string }) => windowState.appId === 'notes');
    expect(notesWindow).toBeTruthy();

    app.minimizeWindow(notesWindow.id);
    let updatedNotes = app.windows().find((windowState: { appId: string }) => windowState.appId === 'notes');
    expect(updatedNotes.minimized).toBe(true);

    app.openApp('notes');
    updatedNotes = app.windows().find((windowState: { appId: string }) => windowState.appId === 'notes');
    expect(updatedNotes.minimized).toBe(false);
  });

  it('should close windows', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    app.skipBootSequence();

    app.openApp('terminal');
    const terminalWindow = app.windows().find((windowState: { appId: string }) => windowState.appId === 'terminal');
    expect(terminalWindow).toBeTruthy();

    app.closeWindow(terminalWindow.id);
    const stillOpen = app.windows().some((windowState: { appId: string }) => windowState.appId === 'terminal');
    expect(stillOpen).toBe(false);
  });

  it('should toggle open control between maximized and restored', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    app.skipBootSequence();

    app.openApp('finder');
    const finderWindow = app.windows().find((windowState: { appId: string }) => windowState.appId === 'finder');
    expect(finderWindow).toBeTruthy();

    const windowLayer = {
      getBoundingClientRect: () => ({ width: 980, height: 620 }),
    } as HTMLElement;

    app.toggleOpenWindow(finderWindow.id, windowLayer);
    let updatedFinder = app.windows().find((windowState: { appId: string }) => windowState.appId === 'finder');
    expect(updatedFinder.maximized).toBe(true);

    app.toggleOpenWindow(finderWindow.id, windowLayer);
    updatedFinder = app.windows().find((windowState: { appId: string }) => windowState.appId === 'finder');
    expect(updatedFinder.maximized).toBe(false);
  });

  it('should resize windows with the resize handle logic', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    app.skipBootSequence();

    app.openApp('notes');
    const notesWindow = app.windows().find((windowState: { appId: string }) => windowState.appId === 'notes');
    expect(notesWindow).toBeTruthy();

    const windowLayer = {
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 980, height: 620 }),
    } as HTMLElement;

    app.startResize(notesWindow.id, windowLayer, {
      button: 0,
      clientX: 300,
      clientY: 220,
      stopPropagation: () => undefined,
    } as PointerEvent);

    app.onPointerMove({
      clientX: 360,
      clientY: 280,
    } as PointerEvent);

    const resizedWindow = app.windows().find((windowState: { appId: string }) => windowState.appId === 'notes');
    expect(resizedWindow.width).toBeGreaterThan(notesWindow.width);
    expect(resizedWindow.height).toBeGreaterThan(notesWindow.height);
  });

  it('should open text files from workspace in text viewer', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    app.skipBootSequence();

    const textFile = app.workspaceItems.find((item: { kind: string }) => item.kind === 'file');
    expect(textFile).toBeTruthy();

    app.openWorkspaceItem(textFile);
    const textViewerWindow = app.windows().find((windowState: { appId: string }) => windowState.appId === 'textviewer');
    expect(textViewerWindow).toBeTruthy();
    expect(app.openedFileName()).toContain('.txt');
  });

  it('should open books app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    app.skipBootSequence();

    app.openApp('books');
    const booksWindow = app.windows().find((windowState: { appId: string }) => windowState.appId === 'books');
    expect(booksWindow).toBeTruthy();
  });

  it('should open courses app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    app.skipBootSequence();

    app.openApp('courses');
    const coursesWindow = app.windows().find((windowState: { appId: string }) => windowState.appId === 'courses');
    expect(coursesWindow).toBeTruthy();
  });

  it('should open quiz app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    app.skipBootSequence();

    app.openApp('quiz');
    const quizWindow = app.windows().find((windowState: { appId: string }) => windowState.appId === 'quiz');
    expect(quizWindow).toBeTruthy();
  });

  it('should unlock founder secret and hidden theme from quiz event', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    app.skipBootSequence();

    expect(app.isFounderSecretUnlocked()).toBe(false);
    expect(app.getThemeMenuItems().some((item: { id: string }) => item.id === 'theme-founder')).toBe(false);

    app.handleQuizSecretUnlocked();

    expect(app.isFounderSecretUnlocked()).toBe(true);
    expect(localStorage.getItem('lacos.quiz.secret.unlocked')).toBe('true');
    expect(app.desktopTheme()).toBe('founder');
    expect(app.getThemeMenuItems().some((item: { id: string }) => item.id === 'theme-founder')).toBe(true);
  });

  it('should run founder boot command only after unlock', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    app.skipBootSequence();

    app.runTerminalCommand('boot --founder');
    let terminalLog = app.terminalLines().join('\n');
    expect(terminalLog).toContain('founder profile is locked');

    app.handleQuizSecretUnlocked();
    app.runTerminalCommand('boot --founder');
    terminalLog = app.terminalLines().join('\n');
    expect(terminalLog).toContain('lacOs Founder Boot v1.0');
    expect(terminalLog).toContain('secret boot');
  });

  it('should open safari app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    app.skipBootSequence();

    app.openApp('safari');
    const safariWindow = app.windows().find((windowState: { appId: string }) => windowState.appId === 'safari');
    expect(safariWindow).toBeTruthy();
  });

  it('should restrict safari navigation to allowed history URLs', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    app.skipBootSequence();

    app.safariInput.set('https://google.com');
    app.submitSafariNavigation();

    expect(app.safariError()).toContain('historico permitido');
    expect(app.safariCurrentUrl()).not.toBe('https://google.com');

    app.safariInput.set('nodejs.org/en');
    app.submitSafariNavigation();

    expect(app.safariError()).toBeNull();
    expect(app.safariCurrentUrl()).toBe('https://nodejs.org/en');
  });

  it('should show external fallback for npm url in safari', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    app.skipBootSequence();

    app.safariInput.set('https://www.npmjs.com/');
    app.submitSafariNavigation();

    expect(app.safariError()).toBeNull();
    expect(app.safariCurrentUrl()).toBe('https://www.npmjs.com/');
    expect(app.safariFrameUrl()).toBeNull();
    expect(app.safariFrameBlockedReason()).toContain('iframe');
  });

  it('should pin and unpin apps from dock via context action', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    app.skipBootSequence();

    app.dockAppIds.set(['finder']);
    app.contextMenu.set({
      visible: true,
      x: 0,
      y: 0,
      appId: 'books',
      fileName: null,
      items: []
    });
    app.handleContextMenuAction('pin');
    expect(app.dockAppIds().includes('books')).toBe(true);

    app.contextMenu.set({
      visible: true,
      x: 0,
      y: 0,
      appId: 'books',
      fileName: null,
      items: []
    });
    app.handleContextMenuAction('unpin');
    expect(app.dockAppIds().includes('books')).toBe(false);
  });

  it('should change desktop theme through context action', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    app.skipBootSequence();

    app.contextMenu.set({
      visible: true,
      x: 0,
      y: 0,
      appId: null,
      fileName: null,
      items: []
    });
    app.handleContextMenuAction('theme-sunset');

    expect(app.desktopTheme()).toBe('sunset');
    expect(localStorage.getItem('lacos.desktop.theme')).toBe('sunset');
  });

  it('should open theme submenu on hover in context menu', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    app.skipBootSequence();

    const mouseEvent = {
      currentTarget: {
        getBoundingClientRect: () => ({ right: 120, top: 80 })
      }
    } as unknown as MouseEvent;

    app.onContextMenuItemEnter({ id: 'themes', label: 'Temas' }, mouseEvent);
    expect(app.contextSubmenu().visible).toBe(true);
    expect(app.contextSubmenu().items.some((item: { id: string }) => item.id === 'theme-classic')).toBe(true);

    app.onContextMenuItemEnter({ id: 'open-terminal', label: 'Abrir Terminal' }, mouseEvent);
    expect(app.contextSubmenu().visible).toBe(false);
  });

  it('should restore desktop theme from storage', () => {
    localStorage.setItem('lacos.desktop.theme', 'grid');
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    app.skipBootSequence();

    expect(app.desktopTheme()).toBe('grid');
  });

  it('should block access on mobile viewport width', () => {
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 800 });

    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    app.skipBootSequence();
    expect(app.isMobileAccessBlocked()).toBe(true);

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth });
    app.onWindowResize();
    expect(app.isMobileAccessBlocked()).toBe(false);
  });
});
