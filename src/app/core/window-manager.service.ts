import { computed, Injectable, signal } from '@angular/core';
import { APPS, AppId, Size } from './apps';

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowState extends WindowBounds {
  id: number;
  appId: AppId;
  /** Overrides the app name in the title bar (e.g. the open file name). */
  title: string | null;
  z: number;
  minimized: boolean;
  maximized: boolean;
  /** Mac OS 8 "WindowShade": collapsed down to the title bar. */
  shaded: boolean;
  restoreBounds: WindowBounds | null;
}

/** Gap kept between windows and the edges of the desktop. */
export const WINDOW_EDGE = 8;
/** Space kept free at the bottom of the desktop so the dock does not cover zoomed windows. */
export const DOCK_RESERVE = 78;
/** How much of a window must remain on screen while dragging, so it can always be grabbed back. */
const MIN_VISIBLE = 80;
const TITLEBAR_HEIGHT = 24;
const CASCADE_STEP = 24;
/** Leaves the first desktop icon columns visible when opening windows on wide screens. */
const ICON_COLUMN_RESERVE = 200;

@Injectable({ providedIn: 'root' })
export class WindowManagerService {
  private readonly windowsState = signal<WindowState[]>([]);
  private readonly layerSizeState = signal<Size>({ width: 1024, height: 640 });
  private nextId = 1;
  private zCounter = 10;

  readonly windows = this.windowsState.asReadonly();
  readonly layerSize = this.layerSizeState.asReadonly();

  /** The front-most visible window, which receives keyboard focus and menu commands. */
  readonly activeWindow = computed<WindowState | null>(() => {
    let top: WindowState | null = null;
    for (const windowState of this.windowsState()) {
      if (!windowState.minimized && (!top || windowState.z > top.z)) {
        top = windowState;
      }
    }
    return top;
  });

  readonly activeAppId = computed<AppId | null>(() => this.activeWindow()?.appId ?? null);

  open(appId: AppId, options: { title?: string } = {}): WindowState {
    const existing = this.findByApp(appId);
    if (existing) {
      this.patch(existing.id, {
        minimized: false,
        shaded: false,
        title: options.title ?? existing.title,
        z: ++this.zCounter
      });
      return this.get(existing.id)!;
    }

    const created = this.createWindow(appId, options.title ?? null);
    this.windowsState.update((windows) => [...windows, created]);
    return created;
  }

  focus(windowId: number): void {
    const target = this.get(windowId);
    if (!target || target.z === this.zCounter) {
      return;
    }
    this.patch(windowId, { z: ++this.zCounter });
  }

  close(windowId: number): void {
    this.windowsState.update((windows) => windows.filter((windowState) => windowState.id !== windowId));
  }

  closeApp(appId: AppId): void {
    const target = this.findByApp(appId);
    if (target) {
      this.close(target.id);
    }
  }

  minimize(windowId: number): void {
    this.patch(windowId, { minimized: true });
  }

  toggleShade(windowId: number): void {
    const target = this.get(windowId);
    if (target) {
      this.patch(windowId, { shaded: !target.shaded, z: ++this.zCounter });
    }
  }

  toggleMaximize(windowId: number): void {
    const target = this.get(windowId);
    if (!target) {
      return;
    }

    if (target.maximized) {
      this.patch(windowId, {
        ...(target.restoreBounds ?? {}),
        maximized: false,
        restoreBounds: null,
        z: ++this.zCounter
      });
      return;
    }

    this.patch(windowId, {
      ...this.getMaximizedBounds(),
      maximized: true,
      shaded: false,
      minimized: false,
      restoreBounds: { x: target.x, y: target.y, width: target.width, height: target.height },
      z: ++this.zCounter
    });
  }

  moveTo(windowId: number, x: number, y: number): void {
    const target = this.get(windowId);
    if (!target || target.maximized) {
      return;
    }

    const { width, height } = this.layerSizeState();
    this.patch(windowId, {
      x: Math.round(clamp(x, MIN_VISIBLE - target.width, width - MIN_VISIBLE)),
      y: Math.round(clamp(y, 0, height - TITLEBAR_HEIGHT))
    });
  }

  resizeTo(windowId: number, width: number, height: number): void {
    const target = this.get(windowId);
    if (!target || target.maximized) {
      return;
    }

    const layer = this.layerSizeState();
    const { minSize } = APPS[target.appId];
    const maxWidth = Math.max(minSize.width, layer.width - target.x - WINDOW_EDGE);
    const maxHeight = Math.max(minSize.height, layer.height - target.y - WINDOW_EDGE);
    this.patch(windowId, {
      width: Math.round(clamp(width, minSize.width, maxWidth)),
      height: Math.round(clamp(height, minSize.height, maxHeight))
    });
  }

  /** Called by the desktop whenever its size changes; keeps every window reachable. */
  setLayerSize(size: Size): void {
    const current = this.layerSizeState();
    if (current.width === size.width && current.height === size.height) {
      return;
    }

    this.layerSizeState.set(size);
    const maximizedBounds = this.getMaximizedBounds();
    this.windowsState.update((windows) =>
      windows.map((windowState) => {
        if (windowState.maximized) {
          return { ...windowState, ...maximizedBounds };
        }

        const width = Math.min(windowState.width, Math.max(APPS[windowState.appId].minSize.width, size.width - WINDOW_EDGE * 2));
        const height = Math.min(windowState.height, Math.max(APPS[windowState.appId].minSize.height, size.height - WINDOW_EDGE * 2));
        return {
          ...windowState,
          width,
          height,
          x: clamp(windowState.x, WINDOW_EDGE, Math.max(WINDOW_EDGE, size.width - width - WINDOW_EDGE)),
          y: clamp(windowState.y, WINDOW_EDGE, Math.max(WINDOW_EDGE, size.height - height - WINDOW_EDGE))
        };
      })
    );
  }

  get(windowId: number): WindowState | undefined {
    return this.windowsState().find((windowState) => windowState.id === windowId);
  }

  findByApp(appId: AppId): WindowState | undefined {
    return this.windowsState().find((windowState) => windowState.appId === appId);
  }

  isRunning(appId: AppId): boolean {
    return this.findByApp(appId) !== undefined;
  }

  isMinimized(appId: AppId): boolean {
    return this.findByApp(appId)?.minimized ?? false;
  }

  private createWindow(appId: AppId, title: string | null): WindowState {
    const layer = this.layerSizeState();
    const { size } = APPS[appId];
    const availableHeight = layer.height - DOCK_RESERVE - WINDOW_EDGE;
    const width = Math.min(size.width, layer.width - WINDOW_EDGE * 2);
    const height = Math.max(TITLEBAR_HEIGHT * 4, Math.min(size.height, availableHeight - WINDOW_EDGE));

    const cascade = (this.windowsState().length % 6) * CASCADE_STEP;
    const preferredX = layer.width - width >= ICON_COLUMN_RESERVE + WINDOW_EDGE
      ? ICON_COLUMN_RESERVE + cascade
      : (layer.width - width) / 2 + cascade;
    const preferredY = WINDOW_EDGE * 2 + cascade;

    return {
      id: this.nextId++,
      appId,
      title,
      x: Math.round(clamp(preferredX, WINDOW_EDGE, layer.width - width - WINDOW_EDGE)),
      y: Math.round(clamp(preferredY, WINDOW_EDGE, availableHeight - height)),
      width,
      height,
      z: ++this.zCounter,
      minimized: false,
      maximized: false,
      shaded: false,
      restoreBounds: null
    };
  }

  private getMaximizedBounds(): WindowBounds {
    const { width, height } = this.layerSizeState();
    return {
      x: WINDOW_EDGE,
      y: WINDOW_EDGE,
      width: Math.max(0, width - WINDOW_EDGE * 2),
      height: Math.max(0, height - WINDOW_EDGE - DOCK_RESERVE)
    };
  }

  private patch(windowId: number, changes: Partial<WindowState>): void {
    this.windowsState.update((windows) =>
      windows.map((windowState) => (windowState.id === windowId ? { ...windowState, ...changes } : windowState))
    );
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}
