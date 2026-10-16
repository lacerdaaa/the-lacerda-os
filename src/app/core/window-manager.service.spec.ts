import { TestBed } from '@angular/core/testing';
import { DOCK_RESERVE, WINDOW_EDGE, WindowManagerService } from './window-manager.service';

describe('WindowManagerService', () => {
  let windows: WindowManagerService;

  beforeEach(() => {
    windows = TestBed.inject(WindowManagerService);
    windows.setLayerSize({ width: 1000, height: 640 });
  });

  it('opens one window per app and focuses it again on reopen', () => {
    const notes = windows.open('notes');
    windows.open('terminal');
    expect(windows.activeAppId()).toBe('terminal');

    const reopened = windows.open('notes');
    expect(reopened.id).toBe(notes.id);
    expect(windows.windows().length).toBe(2);
    expect(windows.activeAppId()).toBe('notes');
  });

  it('minimizes and restores windows, activating the next one', () => {
    windows.open('terminal');
    const notes = windows.open('notes');

    windows.minimize(notes.id);
    expect(windows.isMinimized('notes')).toBe(true);
    expect(windows.activeAppId()).toBe('terminal');

    windows.open('notes');
    expect(windows.isMinimized('notes')).toBe(false);
    expect(windows.activeAppId()).toBe('notes');
  });

  it('closes windows', () => {
    const terminal = windows.open('terminal');
    windows.close(terminal.id);
    expect(windows.isRunning('terminal')).toBe(false);
    expect(windows.activeWindow()).toBeNull();
  });

  it('zooms to the desktop bounds and restores the previous bounds', () => {
    const finder = windows.open('finder');
    windows.toggleMaximize(finder.id);

    const zoomed = windows.get(finder.id)!;
    expect(zoomed.maximized).toBe(true);
    expect(zoomed.width).toBe(1000 - WINDOW_EDGE * 2);
    expect(zoomed.height).toBe(640 - WINDOW_EDGE - DOCK_RESERVE);

    windows.toggleMaximize(finder.id);
    const restored = windows.get(finder.id)!;
    expect(restored.maximized).toBe(false);
    expect(restored.width).toBe(finder.width);
    expect(restored.x).toBe(finder.x);
  });

  it('collapses and expands with WindowShade', () => {
    const notes = windows.open('notes');
    windows.toggleShade(notes.id);
    expect(windows.get(notes.id)!.shaded).toBe(true);
    windows.toggleShade(notes.id);
    expect(windows.get(notes.id)!.shaded).toBe(false);
  });

  it('resizes within the minimum size and the desktop', () => {
    const notes = windows.open('notes');
    windows.resizeTo(notes.id, notes.width + 60, notes.height + 40);
    expect(windows.get(notes.id)!.width).toBe(notes.width + 60);

    windows.resizeTo(notes.id, 10, 10);
    expect(windows.get(notes.id)!.width).toBeGreaterThanOrEqual(280);
    expect(windows.get(notes.id)!.height).toBeGreaterThanOrEqual(220);

    windows.resizeTo(notes.id, 5000, 5000);
    const resized = windows.get(notes.id)!;
    expect(resized.x + resized.width).toBeLessThanOrEqual(1000);
  });

  it('keeps a grabbable part of the window on screen while dragging', () => {
    const notes = windows.open('notes');
    windows.moveTo(notes.id, 5000, -300);
    const moved = windows.get(notes.id)!;
    expect(moved.x).toBeLessThan(1000);
    expect(moved.y).toBe(0);
  });

  it('fits windows into a smaller desktop', () => {
    const safari = windows.open('safari');
    windows.setLayerSize({ width: 500, height: 400 });
    const fitted = windows.get(safari.id)!;
    expect(fitted.x + fitted.width).toBeLessThanOrEqual(500);
    expect(fitted.y + fitted.height).toBeLessThanOrEqual(400);
  });
});
