import { TestBed } from '@angular/core/testing';
import { DEFAULT_DOCK_APPS, DesktopService } from './desktop.service';

describe('DesktopService', () => {
  beforeEach(() => localStorage.clear());

  it('changes and persists the desktop theme', () => {
    const desktop = TestBed.inject(DesktopService);
    desktop.setTheme('sunset');
    expect(desktop.theme()).toBe('sunset');
    expect(localStorage.getItem('lacos.desktop.theme')).toBe('sunset');
  });

  it('restores the theme from storage', () => {
    localStorage.setItem('lacos.desktop.theme', 'grid');
    expect(TestBed.inject(DesktopService).theme()).toBe('grid');
  });

  it('keeps the founder theme locked until the secret is unlocked', () => {
    const desktop = TestBed.inject(DesktopService);
    desktop.setTheme('founder');
    expect(desktop.theme()).toBe('classic');
    expect(desktop.availableThemes()).not.toContain('founder');

    expect(desktop.unlockFounderSecret()).toBe(true);
    expect(desktop.unlockFounderSecret()).toBe(false);
    expect(desktop.theme()).toBe('founder');
    expect(desktop.founderNoticeVisible()).toBe(true);
    expect(localStorage.getItem('lacos.quiz.secret.unlocked')).toBe('true');
    expect(desktop.availableThemes()).toContain('founder');
  });

  it('pins, unpins and resets dock apps', () => {
    const desktop = TestBed.inject(DesktopService);
    desktop.pin('books');
    expect(desktop.isPinned('books')).toBe(true);
    expect(JSON.parse(localStorage.getItem('lacos.dock.apps')!)).toContain('books');

    desktop.unpin('books');
    expect(desktop.isPinned('books')).toBe(false);

    desktop.pin('textviewer');
    expect(desktop.isPinned('textviewer')).toBe(false);

    desktop.resetDock();
    expect(desktop.dockAppIds()).toEqual([...DEFAULT_DOCK_APPS]);
  });

  it('never removes the last dock app', () => {
    localStorage.setItem('lacos.dock.apps', JSON.stringify(['finder']));
    const desktop = TestBed.inject(DesktopService);
    desktop.unpin('finder');
    expect(desktop.dockAppIds()).toEqual(['finder']);
  });

  it('ignores malformed dock storage', () => {
    localStorage.setItem('lacos.dock.apps', '{nope');
    expect(TestBed.inject(DesktopService).dockAppIds()).toEqual([...DEFAULT_DOCK_APPS]);
  });
});
