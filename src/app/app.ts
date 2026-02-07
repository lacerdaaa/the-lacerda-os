import { Component, HostListener, OnDestroy, signal } from '@angular/core';

type AppId = 'about' | 'projects' | 'terminal' | 'notes' | 'finder';

interface DesktopShortcut {
  name: string;
  code: string;
  appId: AppId;
}

interface DockApp {
  name: string;
  code: string;
  appId: AppId;
}

interface ProjectItem {
  name: string;
  summary: string;
  href: string;
}

interface WindowState {
  id: number;
  appId: AppId;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  active: boolean;
  minimized: boolean;
  maximized: boolean;
  restoreBounds: WindowBounds | null;
}

interface DragState {
  windowId: number;
  offsetX: number;
  offsetY: number;
  windowLayer: HTMLElement;
}

interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnDestroy {
  protected readonly menuItems = ['Finder', 'File', 'Edit', 'View', 'Go', 'Window', 'Help'];

  protected readonly desktopShortcuts: DesktopShortcut[] = [
    { name: 'About Me', code: 'AB', appId: 'about' },
    { name: 'Projects', code: 'PR', appId: 'projects' },
    { name: 'Terminal', code: 'TM', appId: 'terminal' },
    { name: 'Notes', code: 'NT', appId: 'notes' }
  ];

  protected readonly dockApps: DockApp[] = [
    { name: 'Finder', code: 'FD', appId: 'finder' },
    { name: 'Notes', code: 'NT', appId: 'notes' },
    { name: 'Terminal', code: 'TM', appId: 'terminal' },
    { name: 'Projects', code: 'PR', appId: 'projects' },
    { name: 'About', code: 'AB', appId: 'about' }
  ];

  protected readonly projectItems: ProjectItem[] = [
    {
      name: 'Product Analytics Lab',
      summary: 'Dashboard simulations with event streams and timeline replay.',
      href: 'https://example.com/product-analytics-lab'
    },
    {
      name: 'Design Token Forge',
      summary: 'Tooling for generating themeable systems and component variants.',
      href: 'https://example.com/design-token-forge'
    },
    {
      name: 'Studio Archive',
      summary: 'Case studies, prototypes, and project retrospectives.',
      href: 'https://example.com/studio-archive'
    }
  ];

  protected readonly windows = signal<WindowState[]>([]);
  protected readonly timeLabel = signal(this.formatTime());
  protected readonly terminalLines = signal<string[]>([
    'macOS8 Terminal v0.1',
    'Type "help" to list commands.'
  ]);
  protected readonly terminalInput = signal('');

  private nextWindowId = 1;
  private zCounter = 10;
  private dragState: DragState | null = null;
  private readonly clockInterval = window.setInterval(() => {
    this.timeLabel.set(this.formatTime());
  }, 30000);

  constructor() {
    this.openApp('about');
    this.openApp('projects');
  }

  ngOnDestroy(): void {
    window.clearInterval(this.clockInterval);
  }

  protected openApp(appId: AppId): void {
    const current = this.windows();
    const existing = current.find((windowState) => windowState.appId === appId);

    if (existing) {
      if (existing.minimized) {
        this.windows.update((windows) =>
          windows.map((windowState) =>
            windowState.id === existing.id
              ? { ...windowState, minimized: false }
              : windowState
          )
        );
      }
      this.bringToFront(existing.id);
      return;
    }

    const createdWindow = this.createWindow(appId);
    this.windows.update((windows) => [
      ...windows.map((windowState) => ({ ...windowState, active: false })),
      createdWindow
    ]);
  }

  protected activateWindow(windowId: number): void {
    this.bringToFront(windowId);
  }

  protected startDrag(windowId: number, windowLayer: HTMLElement, event: PointerEvent): void {
    if (event.button !== 0) {
      return;
    }

    const target = event.currentTarget as HTMLElement | null;
    target?.setPointerCapture(event.pointerId);

    const targetWindow = this.windows().find((windowState) => windowState.id === windowId);
    if (!targetWindow) {
      return;
    }
    if (targetWindow.maximized) {
      return;
    }

    this.bringToFront(windowId);
    const layerBounds = windowLayer.getBoundingClientRect();
    this.dragState = {
      windowId,
      offsetX: event.clientX - layerBounds.left - targetWindow.x,
      offsetY: event.clientY - layerBounds.top - targetWindow.y,
      windowLayer
    };
  }

  protected minimizeWindow(windowId: number, event?: Event): void {
    event?.stopPropagation();

    if (this.dragState?.windowId === windowId) {
      this.dragState = null;
    }

    this.windows.update((windows) =>
      windows.map((windowState) =>
        windowState.id === windowId
          ? { ...windowState, minimized: true, active: false }
          : windowState
      )
    );

    this.activateTopWindow();
  }

  protected closeWindow(windowId: number, event?: Event): void {
    event?.stopPropagation();

    if (this.dragState?.windowId === windowId) {
      this.dragState = null;
    }

    this.windows.update((windows) =>
      windows.filter((windowState) => windowState.id !== windowId)
    );

    this.activateTopWindow();
  }

  protected toggleOpenWindow(windowId: number, windowLayer: HTMLElement, event?: Event): void {
    event?.stopPropagation();

    const currentWindow = this.windows().find((windowState) => windowState.id === windowId);
    if (!currentWindow) {
      return;
    }

    if (currentWindow.maximized && currentWindow.restoreBounds) {
      this.windows.update((windows) =>
        windows.map((windowState) =>
          windowState.id === windowId
            ? {
                ...windowState,
                ...currentWindow.restoreBounds,
                maximized: false,
                restoreBounds: null,
                minimized: false
              }
            : windowState
        )
      );
      this.bringToFront(windowId);
      return;
    }

    const bounds = windowLayer.getBoundingClientRect();
    const margin = 12;
    const width = Math.max(440, Math.floor(bounds.width - margin * 2));
    const height = Math.max(300, Math.floor(bounds.height - margin * 2));

    this.windows.update((windows) =>
      windows.map((windowState) =>
        windowState.id === windowId
          ? {
              ...windowState,
              x: margin,
              y: margin,
              width,
              height,
              maximized: true,
              minimized: false,
              restoreBounds: {
                x: windowState.x,
                y: windowState.y,
                width: windowState.width,
                height: windowState.height
              }
            }
          : windowState
      )
    );
    this.bringToFront(windowId);
  }

  protected isAppOpen(appId: AppId): boolean {
    return this.windows().some(
      (windowState) => windowState.appId === appId && !windowState.minimized
    );
  }

  protected isAppRunning(appId: AppId): boolean {
    return this.windows().some((windowState) => windowState.appId === appId);
  }

  protected isAppMinimized(appId: AppId): boolean {
    return this.windows().some(
      (windowState) => windowState.appId === appId && windowState.minimized
    );
  }

  protected getWindowContentTitle(appId: AppId): string {
    switch (appId) {
      case 'about':
        return 'macOS8 Portfolio';
      case 'projects':
        return 'Featured Projects';
      case 'terminal':
        return 'Terminal';
      case 'notes':
        return 'Notes';
      case 'finder':
        return 'Finder';
      default:
        return 'App';
    }
  }

  protected updateTerminalInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.terminalInput.set(target?.value ?? '');
  }

  protected submitTerminalCommand(): void {
    const rawCommand = this.terminalInput().trim();
    if (!rawCommand) {
      return;
    }

    this.appendTerminalLines([`welcome@macos8:~$ ${rawCommand}`]);
    this.runTerminalCommand(rawCommand);
    this.terminalInput.set('');
  }

  protected runTerminalCommand(rawCommand: string): void {
    const command = rawCommand.trim().toLowerCase();
    const [keyword, ...rest] = command.split(/\s+/);

    switch (keyword) {
      case 'help':
        this.appendTerminalLines([
          'Commands: help, about, projects, open <app>, clear'
        ]);
        return;
      case 'about':
        this.appendTerminalLines([
          'macOS8 is a virtual OS portfolio built with Angular.'
        ]);
        return;
      case 'projects':
        this.appendTerminalLines([
          'Projects: product analytics lab, design token forge, studio archive.'
        ]);
        return;
      case 'open':
        if (rest.length === 0) {
          this.appendTerminalLines(['Usage: open <finder|notes|terminal|projects|about>']);
          return;
        }

        this.openAppFromTerminal(rest[0]);
        return;
      case 'clear':
        this.terminalLines.set([]);
        return;
      default:
        this.appendTerminalLines([`Unknown command: ${rawCommand}`]);
    }
  }

  private openAppFromTerminal(rawTarget: string): void {
    const target = rawTarget.toLowerCase();
    const appAliases: Record<string, AppId> = {
      finder: 'finder',
      notes: 'notes',
      terminal: 'terminal',
      projects: 'projects',
      about: 'about'
    };

    const appId = appAliases[target];
    if (!appId) {
      this.appendTerminalLines([
        `Unknown app: ${rawTarget}`,
        'Available apps: finder, notes, terminal, projects, about'
      ]);
      return;
    }

    this.openApp(appId);
    this.appendTerminalLines([`Launching ${this.getWindowTitle(appId)}...`]);
  }

  private appendTerminalLines(lines: string[]): void {
    this.terminalLines.update((history) => {
      const nextHistory = [...history, ...lines];
      return nextHistory.slice(-80);
    });
  }

  @HostListener('window:pointermove', ['$event'])
  protected onPointerMove(event: PointerEvent): void {
    if (!this.dragState) {
      return;
    }

    const draggedWindow = this.windows().find(
      (windowState) => windowState.id === this.dragState?.windowId
    );

    if (!draggedWindow) {
      this.dragState = null;
      return;
    }

    const layerBounds = this.dragState.windowLayer.getBoundingClientRect();
    const margin = 6;
    const nextX = event.clientX - layerBounds.left - this.dragState.offsetX;
    const nextY = event.clientY - layerBounds.top - this.dragState.offsetY;
    const maxX = Math.max(margin, layerBounds.width - draggedWindow.width - margin);
    const maxY = Math.max(margin, layerBounds.height - draggedWindow.height - margin);

    this.windows.update((windows) =>
      windows.map((windowState) => {
        if (windowState.id !== this.dragState?.windowId) {
          return windowState;
        }

        return {
          ...windowState,
          x: Math.max(margin, Math.min(nextX, maxX)),
          y: Math.max(margin, Math.min(nextY, maxY))
        };
      })
    );
  }

  @HostListener('window:pointerup')
  @HostListener('window:pointercancel')
  protected onPointerEnd(): void {
    this.dragState = null;
  }

  private createWindow(appId: AppId): WindowState {
    const id = this.nextWindowId++;
    const placementOffset = (id - 1) * 26;

    const dimensions = this.getWindowDimensions(appId);
    const title = this.getWindowTitle(appId);

    return {
      id,
      appId,
      title,
      x: Math.min(48 + placementOffset, 180),
      y: Math.min(44 + placementOffset, 160),
      width: dimensions.width,
      height: dimensions.height,
      z: ++this.zCounter,
      active: true,
      minimized: false,
      maximized: false,
      restoreBounds: null
    };
  }

  private getWindowDimensions(appId: AppId): { width: number; height: number } {
    switch (appId) {
      case 'terminal':
        return { width: 580, height: 350 };
      case 'finder':
        return { width: 560, height: 340 };
      case 'notes':
        return { width: 500, height: 330 };
      default:
        return { width: 520, height: 330 };
    }
  }

  private getWindowTitle(appId: AppId): string {
    switch (appId) {
      case 'about':
        return 'Welcome.app';
      case 'projects':
        return 'Projects.app';
      case 'terminal':
        return 'Terminal.app';
      case 'notes':
        return 'Notes.app';
      case 'finder':
        return 'Finder.app';
      default:
        return 'App';
    }
  }

  private bringToFront(windowId: number): void {
    const nextZ = ++this.zCounter;

    this.windows.update((windows) =>
      windows.map((windowState) =>
        windowState.id === windowId
          ? { ...windowState, active: true, z: nextZ }
          : { ...windowState, active: false }
      )
    );
  }

  private activateTopWindow(): void {
    const candidates = this.windows()
      .filter((windowState) => !windowState.minimized)
      .sort((a, b) => b.z - a.z);

    if (candidates.length === 0) {
      return;
    }

    this.bringToFront(candidates[0].id);
  }

  private formatTime(): string {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date());
  }
}
