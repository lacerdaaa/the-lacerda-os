import { Component, HostListener, OnDestroy, signal } from '@angular/core';

type AppId = 'about' | 'projects' | 'terminal' | 'notes' | 'finder' | 'textviewer';

interface DockApp {
  name: string;
  code: string;
  appId: AppId;
}

interface WorkspaceAppItem {
  kind: 'app';
  name: string;
  code: string;
  appId: AppId;
  column: number;
  row: number;
}

interface WorkspaceFileItem {
  kind: 'file';
  name: string;
  code: string;
  fileName: string;
  content: string;
  column: number;
  row: number;
}

type WorkspaceItem = WorkspaceAppItem | WorkspaceFileItem;

interface GithubRepoResponse {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  fork: boolean;
  archived: boolean;
  updated_at: string;
}

interface GithubProject {
  id: number;
  name: string;
  description: string;
  href: string;
  pinned: boolean;
  stars: number;
  updatedAt: string;
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
  private readonly pinnedRepoNames = ['pressum-core-service', 'fynansee-core', 'auto-trace'];
  private readonly aboutMeFileText = `Eduardo Lacerda

Location: Campinas, Sao Paulo, Brazil

I am passionate about technology and building real-world solutions.
I started my professional technology journey in 2024 and I keep evolving every year.

Hobbies:
- Cooking
- History in different contexts (food, finance, geopolitics, economics)

Education:
- Technician degree completed
- Preparing to join USP or UNICAMP
- Goal: Computer Science or Information Systems bachelor's degree

GitHub: github.com/lacerdaaa`;

  protected readonly dockApps: DockApp[] = [
    { name: 'Finder', code: 'FD', appId: 'finder' },
    { name: 'Notes', code: 'NT', appId: 'notes' },
    { name: 'Terminal', code: 'TM', appId: 'terminal' },
    { name: 'Projects', code: 'PR', appId: 'projects' },
    { name: 'About', code: 'AB', appId: 'about' }
  ];

  protected readonly workspaceItems: WorkspaceItem[] = [
    { kind: 'app', name: 'Finder', code: 'APP', appId: 'finder', column: 1, row: 1 },
    { kind: 'app', name: 'Terminal', code: 'APP', appId: 'terminal', column: 1, row: 2 },
    { kind: 'app', name: 'Projects', code: 'APP', appId: 'projects', column: 1, row: 3 },
    {
      kind: 'file',
      name: 'about-me.txt',
      code: 'TXT',
      fileName: 'about-me.txt',
      content: this.aboutMeFileText,
      column: 2,
      row: 1
    },
    {
      kind: 'file',
      name: 'ideas.txt',
      code: 'TXT',
      fileName: 'ideas.txt',
      content: 'Next ideas:\\n- Simulated filesystem\\n- Boot sequence\\n- Installable themes',
      column: 2,
      row: 2
    }
  ];

  protected readonly windows = signal<WindowState[]>([]);
  protected readonly timeLabel = signal(this.formatTime());
  protected readonly terminalLines = signal<string[]>([
    'macOS8 Terminal v0.1',
    'Type "help" to list commands.'
  ]);
  protected readonly terminalInput = signal('');
  protected readonly openedFileName = signal('about-me.txt');
  protected readonly openedFileContent = signal(this.aboutMeFileText);
  protected readonly githubProjects = signal<GithubProject[]>([]);
  protected readonly githubProjectsLoading = signal(false);
  protected readonly githubProjectsError = signal<string | null>(null);

  private nextWindowId = 1;
  private zCounter = 10;
  private dragState: DragState | null = null;
  private githubProjectsLoaded = false;
  private readonly clockInterval = window.setInterval(() => {
    this.timeLabel.set(this.formatTime());
  }, 30000);

  constructor() {
    this.openApp('about');
  }

  ngOnDestroy(): void {
    window.clearInterval(this.clockInterval);
  }

  protected openApp(appId: AppId): void {
    if (appId === 'projects') {
      void this.loadGithubProjects();
    }

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

    const origin = event.target as HTMLElement | null;
    if (origin?.closest('button, input, textarea, select, a, label')) {
      return;
    }

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

  protected openWorkspaceItem(item: WorkspaceItem): void {
    if (item.kind === 'app') {
      this.openApp(item.appId);
      return;
    }

    this.openFile(item.fileName, item.content);
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

  protected getProjectUpdatedLabel(updatedAt: string): string {
    return updatedAt.slice(0, 10);
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
      case 'textviewer':
        return 'Text Viewer';
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
          'Projects.app loads your latest repositories from github.com/lacerdaaa.'
        ]);
        return;
      case 'open':
        if (rest.length === 0) {
          this.appendTerminalLines(['Usage: open <finder|notes|terminal|projects|about|textviewer>']);
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
      about: 'about',
      textviewer: 'textviewer'
    };

    const appId = appAliases[target];
    if (!appId) {
      this.appendTerminalLines([
        `Unknown app: ${rawTarget}`,
        'Available apps: finder, notes, terminal, projects, about, textviewer'
      ]);
      return;
    }

    this.openApp(appId);
    this.appendTerminalLines([`Launching ${this.getWindowTitle(appId)}...`]);
  }

  private openFile(fileName: string, content: string): void {
    this.openedFileName.set(fileName);
    this.openedFileContent.set(content);
    this.openApp('textviewer');

    this.windows.update((windows) =>
      windows.map((windowState) =>
        windowState.appId === 'textviewer'
          ? { ...windowState, title: `${fileName} - Text Viewer` }
          : windowState
      )
    );
  }

  private async loadGithubProjects(): Promise<void> {
    if (this.githubProjectsLoaded || this.githubProjectsLoading()) {
      return;
    }

    this.githubProjectsLoading.set(true);
    this.githubProjectsError.set(null);

    try {
      const response = await fetch('https://api.github.com/users/lacerdaaa/repos?sort=updated&per_page=100');
      if (!response.ok) {
        throw new Error(`GitHub API returned ${response.status}`);
      }

      const repos = await response.json() as GithubRepoResponse[];
      const pinnedOrder = new Map(this.pinnedRepoNames.map((name, index) => [name, index]));
      const normalized = repos
        .filter((repo) => !repo.fork && !repo.archived)
        .sort((a, b) => {
          const aPinnedIndex = pinnedOrder.get(a.name);
          const bPinnedIndex = pinnedOrder.get(b.name);
          const aPinned = aPinnedIndex !== undefined;
          const bPinned = bPinnedIndex !== undefined;

          if (aPinned !== bPinned) {
            return aPinned ? -1 : 1;
          }

          if (aPinned && bPinned && aPinnedIndex !== bPinnedIndex) {
            return (aPinnedIndex ?? 0) - (bPinnedIndex ?? 0);
          }

          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        })
        .map((repo) => ({
          id: repo.id,
          name: repo.name,
          description: repo.description ?? 'No description provided yet.',
          href: repo.html_url,
          pinned: pinnedOrder.has(repo.name),
          stars: repo.stargazers_count,
          updatedAt: repo.updated_at
        }))
        .slice(0, 8);

      this.githubProjects.set(normalized);
      this.githubProjectsLoaded = true;
    } catch {
      this.githubProjectsError.set('Could not load repositories from GitHub right now.');
    } finally {
      this.githubProjectsLoading.set(false);
    }
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
      x: Math.min(190 + placementOffset, 300),
      y: Math.min(56 + placementOffset, 170),
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
      case 'textviewer':
        return { width: 520, height: 340 };
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
      case 'textviewer':
        return 'Text Viewer.app';
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
