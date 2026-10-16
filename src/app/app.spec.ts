import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { DesktopService } from './core/desktop.service';
import { ViewportService } from './core/viewport.service';
import { WindowManagerService } from './core/window-manager.service';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
  });

  const render = () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  };

  it('starts with the boot screen and hides it once booted', () => {
    const { fixture, element } = render();
    expect(element.querySelector('app-boot-screen')).toBeTruthy();

    TestBed.inject(DesktopService).finishBoot();
    fixture.detectChanges();
    expect(element.querySelector('app-boot-screen')).toBeFalsy();
  });

  it('renders the menu bar, desktop icons, dock and the About window', () => {
    const { element } = render();
    expect(element.querySelector('app-menu-bar')).toBeTruthy();
    expect(element.querySelectorAll('.icon').length).toBeGreaterThan(5);
    expect(element.querySelectorAll('.dock-item').length).toBeGreaterThan(0);
    expect(TestBed.inject(WindowManagerService).activeAppId()).toBe('about');
    expect(element.querySelector('app-about')?.textContent).toContain('Eduardo Lacerda');
  });

  it('opens a window when a dock item is clicked', () => {
    const { fixture, element } = render();
    const terminalButton = element.querySelector<HTMLButtonElement>('.dock-item[aria-label="Terminal"]')!;
    terminalButton.click();
    fixture.detectChanges();
    expect(element.querySelector('app-terminal')).toBeTruthy();
  });

  it('shows the founder alert after the secret unlocks', () => {
    const { fixture, element } = render();
    TestBed.inject(DesktopService).unlockFounderSecret();
    fixture.detectChanges();
    expect(element.querySelector('app-alert-dialog')).toBeTruthy();
  });

  it('switches to the compact layout on narrow screens instead of blocking them', () => {
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
    TestBed.inject(ViewportService).refresh();

    const { element } = render();
    expect(TestBed.inject(ViewportService).isCompact()).toBe(true);
    expect(element.querySelector('app-window-frame')?.classList).toContain('compact');

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth });
  });
});
