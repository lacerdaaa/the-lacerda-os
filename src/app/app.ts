import { Component, HostListener, OnDestroy, signal } from '@angular/core';

type AppId = 'about' | 'projects' | 'books' | 'terminal' | 'notes' | 'finder' | 'textviewer';

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

interface BookItem {
  title: string;
  description: string;
  cover: string;
}

interface ContextMenuItem {
  id: 'open' | 'pin' | 'unpin' | 'open-file' | 'open-terminal' | 'open-books' | 'reset-dock';
  label: string;
  danger?: boolean;
  disabled?: boolean;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  appId: AppId | null;
  fileName: string | null;
  items: ContextMenuItem[];
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
  minWidth: number;
  minHeight: number;
  restoreBounds: WindowBounds | null;
}

interface DragState {
  windowId: number;
  offsetX: number;
  offsetY: number;
  windowLayer: HTMLElement;
}

interface ResizeState {
  windowId: number;
  startClientX: number;
  startClientY: number;
  startWidth: number;
  startHeight: number;
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
  private readonly dockStorageKey = 'lacos.dock.apps';
  private readonly terminalVirtualPath = '/Users/eduardo/Desktop';
  private readonly terminalCommandNames = [
    'help',
    'about',
    'projects',
    'books',
    'ls',
    'cat <file>',
    'open <app>',
    'whoami',
    'uname',
    'pwd',
    'date',
    'echo <text>',
    'history',
    'neofetch',
    'clear'
  ];
  private readonly terminalAppAliases: Record<string, AppId> = {
    finder: 'finder',
    notes: 'notes',
    terminal: 'terminal',
    projects: 'projects',
    books: 'books',
    about: 'about',
    textviewer: 'textviewer',
    text: 'textviewer'
  };
  private readonly defaultDockAppIds: AppId[] = ['finder', 'notes', 'terminal', 'projects', 'books', 'about'];
  private readonly appRegistry: Record<AppId, DockApp> = {
    finder: { name: 'Finder', code: 'FD', appId: 'finder' },
    notes: { name: 'Notes', code: 'NT', appId: 'notes' },
    terminal: { name: 'Terminal', code: 'TM', appId: 'terminal' },
    projects: { name: 'Projects', code: 'PR', appId: 'projects' },
    books: { name: 'Books', code: 'BK', appId: 'books' },
    about: { name: 'About', code: 'AB', appId: 'about' },
    textviewer: { name: 'Text Viewer', code: 'TX', appId: 'textviewer' }
  };
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

  protected readonly workspaceItems: WorkspaceItem[] = [
    { kind: 'app', name: 'Finder', code: 'APP', appId: 'finder', column: 1, row: 1 },
    { kind: 'app', name: 'Terminal', code: 'APP', appId: 'terminal', column: 1, row: 2 },
    { kind: 'app', name: 'Projects', code: 'APP', appId: 'projects', column: 1, row: 3 },
    { kind: 'app', name: 'Books', code: 'APP', appId: 'books', column: 1, row: 4 },
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

  protected readonly books: BookItem[] = [
    {
      title: 'Aprenda Domain-Driven Design',
      description: 'Guia pratico para modelar software com foco em dominio e linguagem ubiqua.',
      cover: '/ddd.jpg'
    },
    {
      title: 'As Veias Abertas da America Latina',
      description: 'Classico sobre historia economica e politica da America Latina.',
      cover: '/veias_abertas.jpg'
    },
    {
      title: 'Opusculo Humanitario',
      description: 'Texto curto com reflexoes sociais e humanitarias para ampliar repertorio critico.',
      cover: '/opusculo.jpg'
    },
    {
      title: 'A Vida Nao e Util',
      description: 'Reflexoes de Ailton Krenak sobre sociedade, natureza e sentido coletivo.',
      cover: '/vida_nao_e_util.jpg'
    }
  ];

  protected readonly bootLines = [
    'lacOs BIOS v0.84',
    'Checking memory............................ OK',
    'Mounting virtual desktop................... OK',
    'Loading Finder.app, Projects.app, Books.app',
    'Booting portfolio workspace.................'
  ];
  protected readonly windows = signal<WindowState[]>([]);
  protected readonly isBooting = signal(true);
  protected readonly bootVisibleLines = signal(0);
  protected readonly dockAppIds = signal<AppId[]>([...this.defaultDockAppIds]);
  protected readonly timeLabel = signal(this.formatTime());
  protected readonly terminalPrompt = 'eduardo@lacOs:~$';
  protected readonly terminalLines = signal<string[]>([
    'lacOs Monitor ROM v2.3',
    '64K RAM SYSTEM 38911 BASIC BYTES FREE',
    'READY. Type "help".'
  ]);
  protected readonly terminalInput = signal('');
  protected readonly openedFileName = signal('about-me.txt');
  protected readonly openedFileContent = signal(this.aboutMeFileText);
  protected readonly githubProjects = signal<GithubProject[]>([]);
  protected readonly githubProjectsLoading = signal(false);
  protected readonly githubProjectsError = signal<string | null>(null);
  protected readonly contextMenu = signal<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    appId: null,
    fileName: null,
    items: []
  });

  private nextWindowId = 1;
  private zCounter = 10;
  private dragState: DragState | null = null;
  private resizeState: ResizeState | null = null;
  private bootIntervalId: number | null = null;
  private bootFinishTimeoutId: number | null = null;
  private githubProjectsLoaded = false;
  private terminalCommandHistory: string[] = [];
  private terminalHistoryIndex = -1;
  private terminalDraftInput = '';
  private readonly clockInterval = window.setInterval(() => {
    this.timeLabel.set(this.formatTime());
  }, 30000);

  constructor() {
    this.restoreDockFromStorage();
    this.openApp('about');
    this.beginBootSequence();
  }

  ngOnDestroy(): void {
    window.clearInterval(this.clockInterval);
    this.clearBootTimers();
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
    this.resizeState = null;
  }

  protected startResize(windowId: number, windowLayer: HTMLElement, event: PointerEvent): void {
    event.stopPropagation();
    if (event.button !== 0) {
      return;
    }

    const targetWindow = this.windows().find((windowState) => windowState.id === windowId);
    if (!targetWindow || targetWindow.maximized) {
      return;
    }

    this.bringToFront(windowId);
    this.resizeState = {
      windowId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startWidth: targetWindow.width,
      startHeight: targetWindow.height,
      windowLayer
    };
    this.dragState = null;
  }

  protected minimizeWindow(windowId: number, event?: Event): void {
    event?.stopPropagation();

    if (this.dragState?.windowId === windowId) {
      this.dragState = null;
    }
    if (this.resizeState?.windowId === windowId) {
      this.resizeState = null;
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
    if (this.resizeState?.windowId === windowId) {
      this.resizeState = null;
    }

    this.windows.update((windows) =>
      windows.filter((windowState) => windowState.id !== windowId)
    );

    this.activateTopWindow();
  }

  protected toggleOpenWindow(windowId: number, windowLayer: HTMLElement, event?: Event): void {
    event?.stopPropagation();
    if (this.resizeState?.windowId === windowId) {
      this.resizeState = null;
    }

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

  protected getDockApps(): DockApp[] {
    return this.dockAppIds()
      .map((appId) => this.appRegistry[appId])
      .filter((app): app is DockApp => !!app);
  }

  protected openPageContextMenu(event: MouseEvent): void {
    event.preventDefault();
    this.openContextMenuAt(event.clientX, event.clientY, null, null, [
      { id: 'open-terminal', label: 'Abrir Terminal' },
      { id: 'reset-dock', label: 'Restaurar dock padrao' }
    ]);
  }

  protected openDockContextMenu(appId: AppId, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const canUnpin = this.dockAppIds().length > 1;
    this.openContextMenuAt(event.clientX, event.clientY, appId, null, [
      { id: 'open', label: 'Abrir app' },
      { id: 'unpin', label: 'Remover da dock', danger: true, disabled: !canUnpin }
    ]);
  }

  protected openWorkspaceContextMenu(item: WorkspaceItem, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (item.kind === 'file') {
      this.openContextMenuAt(event.clientX, event.clientY, null, item.fileName, [
        { id: 'open-file', label: 'Abrir arquivo' }
      ]);
      return;
    }

    const pinned = this.isPinnedInDock(item.appId);
    this.openContextMenuAt(event.clientX, event.clientY, item.appId, null, [
      { id: 'open', label: 'Abrir app' },
      { id: pinned ? 'unpin' : 'pin', label: pinned ? 'Remover da dock' : 'Fixar na dock' }
    ]);
  }

  protected openWindowContextMenu(appId: AppId, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.canPinToDock(appId)) {
      this.openContextMenuAt(event.clientX, event.clientY, appId, null, [
        { id: 'open', label: 'Trazer para frente' }
      ]);
      return;
    }

    const pinned = this.isPinnedInDock(appId);
    this.openContextMenuAt(event.clientX, event.clientY, appId, null, [
      { id: 'open', label: 'Trazer para frente' },
      { id: pinned ? 'unpin' : 'pin', label: pinned ? 'Remover da dock' : 'Fixar na dock' }
    ]);
  }

  protected handleContextMenuAction(actionId: ContextMenuItem['id']): void {
    const menu = this.contextMenu();

    switch (actionId) {
      case 'open':
        if (menu.appId) {
          this.openApp(menu.appId);
        }
        break;
      case 'pin':
        if (menu.appId) {
          this.pinToDock(menu.appId);
        }
        break;
      case 'unpin':
        if (menu.appId) {
          this.unpinFromDock(menu.appId);
        }
        break;
      case 'open-file':
        if (menu.fileName) {
          const item = this.workspaceItems.find(
            (workspaceItem) => workspaceItem.kind === 'file' && workspaceItem.fileName === menu.fileName
          );
          if (item && item.kind === 'file') {
            this.openFile(item.fileName, item.content);
          }
        }
        break;
      case 'open-terminal':
        this.openApp('terminal');
        break;
      case 'open-books':
        this.openApp('books');
        break;
      case 'reset-dock':
        this.dockAppIds.set([...this.defaultDockAppIds]);
        this.persistDockToStorage();
        break;
    }

    this.closeContextMenu();
  }

  protected closeContextMenu(): void {
    if (!this.contextMenu().visible) {
      return;
    }

    this.contextMenu.set({
      visible: false,
      x: 0,
      y: 0,
      appId: null,
      fileName: null,
      items: []
    });
  }

  protected skipBootSequence(): void {
    this.finishBootSequence();
  }

  @HostListener('window:click')
  protected onWindowClick(): void {
    this.closeContextMenu();
  }

  @HostListener('window:keydown.escape')
  protected onEscapePressed(): void {
    this.closeContextMenu();
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

  protected getAppIconKey(appId: AppId): string {
    return appId;
  }

  protected getWorkspaceIconKey(item: WorkspaceItem): string {
    if (item.kind === 'file') {
      return 'file';
    }

    return this.getAppIconKey(item.appId);
  }

  protected getProjectUpdatedLabel(updatedAt: string): string {
    return updatedAt.slice(0, 10);
  }

  protected getWindowContentTitle(appId: AppId): string {
    switch (appId) {
      case 'about':
        return 'about me';
      case 'projects':
        return 'Featured Projects';
      case 'books':
        return 'Books';
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

  protected onTerminalKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.navigateTerminalHistory(true);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.navigateTerminalHistory(false);
      return;
    }

    if (event.ctrlKey && event.key.toLowerCase() === 'l') {
      event.preventDefault();
      this.terminalLines.set([]);
      return;
    }
  }

  protected submitTerminalCommand(): void {
    const rawCommand = this.terminalInput().trim();
    if (!rawCommand) {
      return;
    }

    this.appendTerminalLines([`${this.terminalPrompt} ${rawCommand}`]);
    this.storeTerminalHistory(rawCommand);
    this.terminalHistoryIndex = -1;
    this.terminalDraftInput = '';
    this.runTerminalCommand(rawCommand);
    this.terminalInput.set('');
  }

  protected runTerminalCommand(rawCommand: string): void {
    const sanitizedCommand = rawCommand.trim();
    if (!sanitizedCommand) {
      return;
    }

    const [keywordToken, ...rest] = sanitizedCommand.split(/\s+/);
    const keyword = keywordToken.toLowerCase();
    const argumentText = sanitizedCommand.slice(keywordToken.length).trim();

    switch (keyword) {
      case 'help':
        this.appendTerminalLines([
          'Available commands:',
          ...this.terminalCommandNames.map((commandName) => `  - ${commandName}`)
        ]);
        return;
      case 'about':
        this.appendTerminalLines([
          'lacOs is a virtual OS portfolio built with Angular.'
        ]);
        return;
      case 'projects':
        this.appendTerminalLines([
          'Projects.app loads your latest repositories from github.com/lacerdaaa.'
        ]);
        return;
      case 'books':
        this.appendTerminalLines([
          'Books.app has a retro bookshelf with your selected readings.'
        ]);
        return;
      case 'ls':
      case 'dir':
        this.appendTerminalLines(this.getWorkspaceListingLines());
        return;
      case 'cat':
      case 'type':
        if (!argumentText) {
          this.appendTerminalLines(['Usage: cat <about-me.txt|ideas.txt>']);
          return;
        }

        this.printTerminalFile(argumentText);
        return;
      case 'open':
        if (rest.length === 0) {
          this.appendTerminalLines(['Usage: open <finder|notes|terminal|projects|books|about|textviewer>']);
          return;
        }

        this.openAppFromTerminal(rest[0]);
        return;
      case 'whoami':
        this.appendTerminalLines(['eduardo']);
        return;
      case 'uname':
        this.appendTerminalLines(['lacOs 0.8 (virtual 68k)']);
        return;
      case 'pwd':
        this.appendTerminalLines([this.terminalVirtualPath]);
        return;
      case 'date':
        this.appendTerminalLines([new Date().toString()]);
        return;
      case 'echo':
        this.appendTerminalLines([argumentText]);
        return;
      case 'history':
        this.appendTerminalLines(this.getTerminalHistoryLines());
        return;
      case 'neofetch':
        this.appendTerminalLines([
          'lacOs',
          'Kernel: virtual.angular',
          'Uptime: session active',
          'Shell: retrosh 0.8',
          'Resolution: 4:3 CRT',
          'Theme: Teal Classic'
        ]);
        return;
      case 'clear':
      case 'cls':
        this.terminalLines.set([]);
        return;
      default:
        this.appendTerminalLines([`Command not found: ${rawCommand}`]);
    }
  }

  private openContextMenuAt(
    x: number,
    y: number,
    appId: AppId | null,
    fileName: string | null,
    items: ContextMenuItem[]
  ): void {
    const menuWidth = 190;
    const menuHeight = Math.max(36, items.length * 30 + 8);
    const margin = 6;
    const clampedX = Math.min(x, window.innerWidth - menuWidth - margin);
    const clampedY = Math.min(y, window.innerHeight - menuHeight - margin);

    this.contextMenu.set({
      visible: true,
      x: Math.max(margin, clampedX),
      y: Math.max(margin, clampedY),
      appId,
      fileName,
      items
    });
  }

  private beginBootSequence(): void {
    this.clearBootTimers();
    this.isBooting.set(true);
    this.bootVisibleLines.set(0);

    this.bootIntervalId = window.setInterval(() => {
      const nextLine = this.bootVisibleLines() + 1;
      this.bootVisibleLines.set(nextLine);

      if (nextLine >= this.bootLines.length) {
        if (this.bootIntervalId !== null) {
          window.clearInterval(this.bootIntervalId);
          this.bootIntervalId = null;
        }

        this.bootFinishTimeoutId = window.setTimeout(() => {
          this.finishBootSequence();
        }, 600);
      }
    }, 220);
  }

  private finishBootSequence(): void {
    this.clearBootTimers();
    this.bootVisibleLines.set(this.bootLines.length);
    this.isBooting.set(false);
  }

  private clearBootTimers(): void {
    if (this.bootIntervalId !== null) {
      window.clearInterval(this.bootIntervalId);
      this.bootIntervalId = null;
    }

    if (this.bootFinishTimeoutId !== null) {
      window.clearTimeout(this.bootFinishTimeoutId);
      this.bootFinishTimeoutId = null;
    }
  }

  private isPinnedInDock(appId: AppId): boolean {
    return this.dockAppIds().includes(appId);
  }

  private canPinToDock(appId: AppId): boolean {
    return appId !== 'textviewer';
  }

  private pinToDock(appId: AppId): void {
    if (!this.canPinToDock(appId) || this.isPinnedInDock(appId)) {
      return;
    }

    this.dockAppIds.update((appIds) => [...appIds, appId]);
    this.persistDockToStorage();
  }

  private unpinFromDock(appId: AppId): void {
    if (!this.isPinnedInDock(appId)) {
      return;
    }

    this.dockAppIds.update((appIds) => {
      if (appIds.length <= 1) {
        return appIds;
      }

      return appIds.filter((id) => id !== appId);
    });
    this.persistDockToStorage();
  }

  private persistDockToStorage(): void {
    try {
      localStorage.setItem(this.dockStorageKey, JSON.stringify(this.dockAppIds()));
    } catch {
      // Ignore storage errors in private mode or blocked storage environments.
    }
  }

  private restoreDockFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.dockStorageKey);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return;
      }

      const allowed = new Set<AppId>(['finder', 'notes', 'terminal', 'projects', 'books', 'about']);
      const restored = parsed.filter(
        (appId): appId is AppId => typeof appId === 'string' && allowed.has(appId as AppId)
      );

      if (restored.length > 0) {
        this.dockAppIds.set(restored);
      }
    } catch {
      // Ignore malformed local storage payloads and keep defaults.
    }
  }

  private openAppFromTerminal(rawTarget: string): void {
    const target = rawTarget.toLowerCase();
    const appId = this.terminalAppAliases[target];
    if (!appId) {
      this.appendTerminalLines([
        `Unknown app: ${rawTarget}`,
        'Available apps: finder, notes, terminal, projects, books, about, textviewer'
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

  private navigateTerminalHistory(previous: boolean): void {
    const total = this.terminalCommandHistory.length;
    if (total === 0) {
      return;
    }

    if (previous) {
      if (this.terminalHistoryIndex === -1) {
        this.terminalDraftInput = this.terminalInput();
      }

      if (this.terminalHistoryIndex < total - 1) {
        this.terminalHistoryIndex += 1;
      }
    } else {
      if (this.terminalHistoryIndex === -1) {
        return;
      }

      this.terminalHistoryIndex -= 1;
      if (this.terminalHistoryIndex === -1) {
        this.terminalInput.set(this.terminalDraftInput);
        return;
      }
    }

    const commandIndex = total - 1 - this.terminalHistoryIndex;
    this.terminalInput.set(this.terminalCommandHistory[commandIndex] ?? '');
  }

  private storeTerminalHistory(command: string): void {
    const lastCommand = this.terminalCommandHistory[this.terminalCommandHistory.length - 1];
    if (lastCommand === command) {
      return;
    }

    this.terminalCommandHistory = [...this.terminalCommandHistory, command].slice(-40);
  }

  private getWorkspaceListingLines(): string[] {
    const appEntries = this.workspaceItems
      .filter((item): item is WorkspaceAppItem => item.kind === 'app')
      .map((item) => `${item.name}.app`);
    const fileEntries = this.workspaceItems
      .filter((item): item is WorkspaceFileItem => item.kind === 'file')
      .map((item) => item.fileName);

    return [
      `${this.terminalVirtualPath}:`,
      [...appEntries, ...fileEntries].join('  ')
    ];
  }

  private printTerminalFile(fileName: string): void {
    const normalizedTarget = fileName.toLowerCase();
    const fileItem = this.workspaceItems.find(
      (item) =>
        item.kind === 'file' &&
        (item.fileName.toLowerCase() === normalizedTarget || item.name.toLowerCase() === normalizedTarget)
    );

    if (!fileItem || fileItem.kind !== 'file') {
      this.appendTerminalLines([`cat: ${fileName}: No such file`]);
      return;
    }

    this.appendTerminalLines([`--- ${fileItem.fileName} ---`, fileItem.content]);
  }

  private getTerminalHistoryLines(): string[] {
    if (this.terminalCommandHistory.length === 0) {
      return ['No command history yet.'];
    }

    const visibleHistory = this.terminalCommandHistory.slice(-12);
    const startIndex = this.terminalCommandHistory.length - visibleHistory.length + 1;
    return visibleHistory.map((command, index) => `${startIndex + index}: ${command}`);
  }

  @HostListener('window:pointermove', ['$event'])
  protected onPointerMove(event: PointerEvent): void {
    if (this.dragState) {
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
      return;
    }

    if (!this.resizeState) {
      return;
    }

    const resizedWindow = this.windows().find(
      (windowState) => windowState.id === this.resizeState?.windowId
    );

    if (!resizedWindow) {
      this.resizeState = null;
      return;
    }

    const layerBounds = this.resizeState.windowLayer.getBoundingClientRect();
    const margin = 6;
    const deltaX = event.clientX - this.resizeState.startClientX;
    const deltaY = event.clientY - this.resizeState.startClientY;
    const maxWidth = Math.max(
      resizedWindow.minWidth,
      layerBounds.width - resizedWindow.x - margin
    );
    const maxHeight = Math.max(
      resizedWindow.minHeight,
      layerBounds.height - resizedWindow.y - margin
    );
    const nextWidth = Math.max(
      resizedWindow.minWidth,
      Math.min(this.resizeState.startWidth + deltaX, maxWidth)
    );
    const nextHeight = Math.max(
      resizedWindow.minHeight,
      Math.min(this.resizeState.startHeight + deltaY, maxHeight)
    );

    this.windows.update((windows) =>
      windows.map((windowState) =>
        windowState.id === this.resizeState?.windowId
          ? { ...windowState, width: nextWidth, height: nextHeight }
          : windowState
      )
    );
  }

  @HostListener('window:pointerup')
  @HostListener('window:pointercancel')
  protected onPointerEnd(): void {
    this.dragState = null;
    this.resizeState = null;
  }

  private createWindow(appId: AppId): WindowState {
    const id = this.nextWindowId++;
    const placementOffset = (id - 1) * 26;

    const dimensions = this.getWindowDimensions(appId);
    const minimums = this.getWindowMinimumDimensions(appId);
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
      minWidth: minimums.width,
      minHeight: minimums.height,
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
      case 'books':
        return { width: 620, height: 380 };
      case 'textviewer':
        return { width: 520, height: 340 };
      default:
        return { width: 520, height: 330 };
    }
  }

  private getWindowMinimumDimensions(appId: AppId): { width: number; height: number } {
    switch (appId) {
      case 'terminal':
        return { width: 420, height: 260 };
      case 'finder':
        return { width: 420, height: 250 };
      case 'notes':
        return { width: 380, height: 240 };
      case 'books':
        return { width: 460, height: 280 };
      case 'textviewer':
        return { width: 400, height: 250 };
      default:
        return { width: 400, height: 240 };
    }
  }

  private getWindowTitle(appId: AppId): string {
    switch (appId) {
      case 'about':
        return 'Welcome.app';
      case 'projects':
        return 'Projects.app';
      case 'books':
        return 'Books.app';
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
