import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the desktop shell title', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('macOS8 Portfolio');
  });

  it('should show at least one window', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.window').length).toBeGreaterThan(0);
  });

  it('should open apps from terminal commands', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;

    app.runTerminalCommand('open notes');

    const windows = app.windows();
    expect(windows.some((windowState: { appId: string }) => windowState.appId === 'notes')).toBe(true);
  });

  it('should minimize and reopen windows', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;

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
});
