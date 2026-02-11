import { Component, HostListener, OnDestroy, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AboutQuizComponent } from './about-quiz/about-quiz.component';

type AppId = 'about' | 'projects' | 'books' | 'courses' | 'quiz' | 'terminal' | 'notes' | 'finder' | 'textviewer' | 'safari';

function normalizeBrowserUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return null;
  }

  const absoluteUrl = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(absoluteUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null;
    }

    parsed.hash = '';
    const normalizedPath = parsed.pathname !== '/' && parsed.pathname.endsWith('/')
      ? parsed.pathname.slice(0, -1)
      : parsed.pathname;
    const normalized = `${parsed.protocol}//${parsed.host}${normalizedPath}${parsed.search}`;
    return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
  } catch {
    return null;
  }
}

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
  attachments?: FileAttachment[];
  column: number;
  row: number;
}

type WorkspaceItem = WorkspaceAppItem | WorkspaceFileItem;

interface FileAttachment {
  label: string;
  src: string;
}

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

interface CourseItem {
  title: string;
  organization: string;
  logo: string;
  issuedAt: string;
  summary: string;
  skills: string;
  credentialCode?: string;
}

interface SafariHistoryEntry {
  id: string;
  label: string;
  url: string;
  note: string;
}

interface ContextMenuItem {
  id:
    | 'open'
    | 'pin'
    | 'unpin'
    | 'open-file'
    | 'open-terminal'
    | 'open-books'
    | 'open-courses'
    | 'open-quiz'
    | 'open-safari'
    | 'reset-dock'
    | 'themes'
    | 'theme-classic'
    | 'theme-sunset'
    | 'theme-grid'
    | 'theme-founder';
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

interface ContextSubmenuState {
  visible: boolean;
  x: number;
  y: number;
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

type SnakeDirection = 'up' | 'down' | 'left' | 'right';

interface SnakePosition {
  x: number;
  y: number;
}

type DesktopTheme = 'classic' | 'sunset' | 'grid' | 'founder';

@Component({
  selector: 'app-root',
  imports: [AboutQuizComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnDestroy {
  protected readonly menuItems = ['Finder', 'File', 'Edit', 'View', 'Go', 'Window', 'Help'];
  private readonly pinnedRepoNames = ['pressum-core-service', 'fynansee-core', 'auto-trace'];
  private readonly dockStorageKey = 'lacos.dock.apps';
  private readonly desktopThemeStorageKey = 'lacos.desktop.theme';
  private readonly quizSecretStorageKey = 'lacos.quiz.secret.unlocked';
  private readonly mobileLayoutMaxWidth = 900;
  private readonly cursorBoostClassName = 'cursor-boost';
  private readonly cursorBoostSpeedThreshold = 1800;
  private readonly cursorBoostDurationMs = 140;
  private readonly safariIframeBlockedHosts = new Set([
    'github.com',
    'www.github.com',
    'learn.microsoft.com',
    'dotnet.microsoft.com',
    'npmjs.com',
    'www.npmjs.com',
    'refactoring.guru',
    'www.refactoring.guru'
  ]);
  private readonly safariPresetHistory: SafariHistoryEntry[] = [
    {
      id: 'nodejs',
      label: 'Node.js',
      url: 'https://nodejs.org/en',
      note: 'Site oficial do Node.js.'
    },
    {
      id: 'npm',
      label: 'npm',
      url: 'https://www.npmjs.com/',
      note: 'Gerenciador de pacotes do ecossistema Node.'
    },
    {
      id: 'ddd-community',
      label: 'DDD Community',
      url: 'https://dddcommunity.org/',
      note: 'Conteudo sobre Domain-Driven Design.'
    },
    {
      id: 'design-patterns',
      label: 'Design Patterns',
      url: 'https://refactoring.guru/design-patterns',
      note: 'Catalogo pratico de padroes de design.'
    }
  ];
  private readonly safariAllowedUrlMap = new Map(
    this.safariPresetHistory
      .map((entry) => {
        const normalizedUrl = normalizeBrowserUrl(entry.url);
        return normalizedUrl ? [normalizedUrl, entry] as const : null;
      })
      .filter((entry): entry is readonly [string, SafariHistoryEntry] => entry !== null)
  );
  private readonly terminalVirtualPath = '/Users/eduardo/Desktop';
  private readonly terminalCommandNames = [
    'help',
    'about',
    'projects',
    'books',
    'courses',
    'quiz',
    'safari',
    'ls',
    'cat <file>',
    'open <app>',
    'whoami',
    'uname',
    'pwd',
    'date',
    'echo <text>',
    'guess',
    'placar',
    'snake',
    'snake-score',
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
    courses: 'courses',
    quiz: 'quiz',
    safari: 'safari',
    about: 'about',
    textviewer: 'textviewer',
    text: 'textviewer'
  };
  private readonly defaultDockAppIds: AppId[] = ['finder', 'safari', 'notes', 'terminal', 'projects', 'books', 'courses', 'quiz', 'about'];
  private readonly windowDefaultHeightBoost = 36;
  private readonly windowMinimumHeightBoost = 24;
  private readonly appRegistry: Record<AppId, DockApp> = {
    finder: { name: 'Finder', code: 'FD', appId: 'finder' },
    safari: { name: 'Safari', code: 'SF', appId: 'safari' },
    notes: { name: 'Notes', code: 'NT', appId: 'notes' },
    terminal: { name: 'Terminal', code: 'TM', appId: 'terminal' },
    projects: { name: 'Projects', code: 'PR', appId: 'projects' },
    books: { name: 'Books', code: 'BK', appId: 'books' },
    courses: { name: 'Courses', code: 'CR', appId: 'courses' },
    quiz: { name: 'Quiz', code: 'QZ', appId: 'quiz' },
    about: { name: 'About', code: 'AB', appId: 'about' },
    textviewer: { name: 'Text Viewer', code: 'TX', appId: 'textviewer' }
  };
  protected readonly aboutProfileName = 'Eduardo Lacerda';
  protected readonly aboutProfileParagraphs = [
    'I live in Campinas, São Paulo, Brazil. I am passionate about technology and building real-world solutions.',
    "I started my professional journey in technology in 2024 and I keep evolving more each year. I work primarily with TypeScript, using frameworks such as Angular, React, and Node.js. I also have hands-on experience with .NET and Python. Currently, I'm building Pressum and Fynansee.",
    'As hobbies, I love cooking and learning history in different contexts: food, finance, geopolitics, and economics. I also enjoy reading and listening to music.',
    "I have a technician degree and I am studying to join USP or UNICAMP, aiming for a bachelor's degree in Computer Science or Information Systems. I deeply care about software development best practices, including Domain-Driven Design (DDD) and Test-Driven Development (TDD)."
  ];
  protected readonly aboutProfileGithubUrl = 'https://github.com/lacerdaaa';
  protected readonly aboutProfileGithubLabel = 'github.com/lacerdaaa';
  private readonly aboutMeFileText = [
    this.aboutProfileName,
    '',
    ...this.aboutProfileParagraphs,
    '',
    `GitHub: ${this.aboutProfileGithubLabel}`
  ].join('\n\n');
  private readonly aboutMeFileAttachments: FileAttachment[] = [
    { label: 'Angular', src: '/skills/angular.svg' },
    { label: 'TypeScript', src: '/skills/typescript.svg' },
    { label: 'JavaScript', src: '/skills/javascript.svg' },
    { label: '.NET', src: '/skills/dotnet.svg' },
    { label: 'NestJS', src: '/skills/nestjs.svg' },
    { label: 'Docker', src: '/skills/docker.svg' },
    { label: 'Kubernetes', src: '/skills/kubernetes.svg' },
    { label: 'Terraform', src: '/skills/terraform.svg' },
    { label: 'Jest', src: '/skills/jest.svg' }
  ];

  protected readonly workspaceItems: WorkspaceItem[] = [
    { kind: 'app', name: 'Finder', code: 'APP', appId: 'finder', column: 1, row: 1 },
    { kind: 'app', name: 'Safari', code: 'APP', appId: 'safari', column: 1, row: 2 },
    { kind: 'app', name: 'Terminal', code: 'APP', appId: 'terminal', column: 1, row: 3 },
    { kind: 'app', name: 'Projects', code: 'APP', appId: 'projects', column: 1, row: 4 },
    { kind: 'app', name: 'Books', code: 'APP', appId: 'books', column: 1, row: 5 },
    { kind: 'app', name: 'Courses', code: 'APP', appId: 'courses', column: 1, row: 6 },
    { kind: 'app', name: 'Quiz', code: 'APP', appId: 'quiz', column: 2, row: 2 },
    {
      kind: 'file',
      name: 'about-me.txt',
      code: 'TXT',
      fileName: 'about-me.txt',
      content: this.aboutMeFileText,
      attachments: this.aboutMeFileAttachments,
      column: 2,
      row: 1
    }
  ];

  protected readonly books: BookItem[] = [
    {
      title: 'Aprenda Domain-Driven Design',
      description: 'Guia prático e conciso para modelar software com foco no domínio, na linguagem ubíqua e em táticas de design que melhoram a comunicação entre equipes e stakeholders.',
      cover: '/ddd.jpg'
    },
    {
      title: 'As Veias Abertas da América Latina',
      description: 'Análise clássica e contundente sobre a exploração econômica e os impactos do colonialismo na América Latina, combinando pesquisa histórica e crítica política.',
      cover: '/veias_abertas.jpg'
    },
    {
      title: 'Opúsculo Humanitário',
      description: 'Texto breve e denso com reflexões sobre solidariedade, ética e responsabilidade social, útil para ampliar repertório crítico e empático.',
      cover: '/opusculo.jpg'
    },
    {
      title: 'A Vida Não é Útil',
      description: 'Ensaios reflexivos de Ailton Krenak sobre a relação entre sociedade e natureza, propondo modos de vida e pensamento coletivo que valorizam a sustentabilidade e o cuidado.',
      cover: '/vida_nao_e_util.jpg'
    }
  ];

  protected readonly courses: CourseItem[] = [
    {
      title: 'Testes Automatizados com Jest',
      organization: 'Udemy',
      logo: '/udemy_logo.jpeg',
      issuedAt: 'out de 2025',
      summary: 'Curso prático sobre testes unitários e de integração com Jest, com foco em qualidade e manutenção de código.',
      skills: 'Jest · Automação de testes'
    },
    {
      title: 'Pipelines CI/CD com GitHub Actions',
      organization: 'Rocketseat',
      logo: '/rocketseat_logo.jpeg',
      issuedAt: 'set de 2025',
      summary: 'Construção de pipelines de integração e entrega contínuas para automatizar validação, build e deploy.',
      skills: 'Integração e entrega contínuas (CI/CD)',
      credentialCode: '42a3f889-2cfd-4bd8-a271-a7f09dfa8593'
    },
    {
      title: 'IAC com Terraform',
      organization: 'Rocketseat',
      logo: '/rocketseat_logo.jpeg',
      issuedAt: 'mai de 2025',
      summary: 'Fundamentos de infraestrutura como código com Terraform para provisionamento padronizado e escalável.',
      skills: 'Infraestrutura como código (IaC) · Terraform',
      credentialCode: 'd5939e53-0621-4770-9142-10d65a78b540'
    },
    {
      title: 'Containers com Docker e Docker Compose',
      organization: 'Rocketseat',
      logo: '/rocketseat_logo.jpeg',
      issuedAt: 'abr de 2025',
      summary: 'Orquestração de ambientes de desenvolvimento e execução de aplicações em contêineres com Docker.',
      skills: 'Docker · Docker Compose',
      credentialCode: '47d26a8a-46e7-4d8c-9c11-226a2e6821e3'
    },
    {
      title: 'Fundamentos da Cultura DevOps',
      organization: 'Rocketseat',
      logo: '/rocketseat_logo.jpeg',
      issuedAt: 'abr de 2025',
      summary: 'Princípios de colaboração, automação e entrega contínua para criar fluxos de engenharia mais confiáveis.',
      skills: 'DevOps · Integração contínua',
      credentialCode: 'c732204e-a6a9-4e86-b0ed-723ea0bdd0f4'
    },
    {
      title: 'React: Software Architecture',
      organization: 'LinkedIn',
      logo: '/linkedin_logo.jpeg',
      issuedAt: 'nov de 2024',
      summary: 'Arquitetura de aplicações React com foco em escalabilidade, organização de componentes e separação de responsabilidades.',
      skills: 'Arquitetura de software'
    },
    {
      title: 'CSS: Variables and Fluid Layouts',
      organization: 'LinkedIn',
      logo: '/linkedin_logo.jpeg',
      issuedAt: 'nov de 2024',
      summary: 'Uso de variáveis CSS e técnicas de layouts fluidos para interfaces responsivas e consistentes.',
      skills: 'CSS'
    },
    {
      title: 'TypeScript Essential Training',
      organization: 'LinkedIn',
      logo: '/linkedin_logo.jpeg',
      issuedAt: 'nov de 2024',
      summary: 'Base sólida de TypeScript para tipagem estática, segurança em refatorações e produtividade no desenvolvimento.',
      skills: 'TypeScript'
    },
    {
      title: 'React: Design Patterns',
      organization: 'LinkedIn',
      logo: '/linkedin_logo.jpeg',
      issuedAt: 'nov de 2024',
      summary: 'Aplicação de padrões de projeto em React para reduzir acoplamento e melhorar reutilização de componentes.',
      skills: 'Padrões de projeto de software'
    },
    {
      title: 'Building Production-Ready React Apps: Setup to Deployment with Firebase',
      organization: 'LinkedIn',
      logo: '/linkedin_logo.jpeg',
      issuedAt: 'nov de 2024',
      summary: 'Configuração e entrega de aplicações React para produção com estratégia de deploy e serviços Firebase.',
      skills: 'React.js · Aplicativos de página única'
    },
    {
      title: 'Learning Next.js',
      organization: 'LinkedIn',
      logo: '/linkedin_logo.jpeg',
      issuedAt: 'nov de 2024',
      summary: 'Fundamentos de desenvolvimento web moderno com Next.js, SSR e estrutura de projetos orientada a performance.',
      skills: 'Desenvolvimento de front-end · Desenvolvimento web'
    },
    {
      title: 'Git e GitHub: Formação Básica',
      organization: 'LinkedIn',
      logo: '/linkedin_logo.jpeg',
      issuedAt: 'nov de 2024',
      summary: 'Fluxos essenciais de versionamento, colaboração e revisão de código com Git e GitHub.',
      skills: 'GitHub · Desenvolvimento de software · Git'
    },
    {
      title: 'GitHub Actions: Formação Básica',
      organization: 'LinkedIn',
      logo: '/linkedin_logo.jpeg',
      issuedAt: 'nov de 2024',
      summary: 'Automação de workflows de build, testes e entrega utilizando GitHub Actions.',
      skills: 'Automação de TI · GitHub · Integração e entrega contínuas (CI/CD)'
    }
  ];

  protected readonly bootLines = [
    'lacOs BIOS v0.84',
    'Checking memory............................ OK',
    'Mounting virtual desktop................... OK',
    'Loading Finder.app, Safari.app, Projects.app, Books.app, Courses.app, Quiz.app',
    'Booting portfolio workspace.................'
  ];
  protected readonly windows = signal<WindowState[]>([]);
  protected readonly isBooting = signal(true);
  protected readonly isMobileAccessBlocked = signal(false);
  protected readonly isFounderSecretUnlocked = signal(false);
  protected readonly isFounderUnlockNoticeVisible = signal(false);
  protected readonly bootVisibleLines = signal(0);
  protected readonly founderUnlockLines = [
    'lacOs Secret Monitor v1.0',
    'Founder profile integrity.................. OK',
    'Unlocking hidden desktop theme............. OK',
    'Founder theme unlocked.',
    'Command enabled: boot --founder'
  ];
  protected readonly dockAppIds = signal<AppId[]>([...this.defaultDockAppIds]);
  protected readonly desktopTheme = signal<DesktopTheme>('classic');
  protected readonly timeLabel = signal(this.formatTime());
  protected readonly terminalPrompt = 'eduardo@lacOs:~$';
  protected readonly terminalLines = signal<string[]>([
    'lacOs Monitor ROM v2.3',
    '64K RAM SYSTEM 38911 BASIC BYTES FREE',
    'READY. Type "help".'
  ]);
  protected readonly terminalSnakeBoard = signal<string[] | null>(null);
  protected readonly terminalInput = signal('');
  protected readonly openedFileName = signal('about-me.txt');
  protected readonly openedFileContent = signal(this.aboutMeFileText);
  protected readonly openedFileAttachments = signal<FileAttachment[]>([...this.aboutMeFileAttachments]);
  protected readonly githubProjects = signal<GithubProject[]>([]);
  protected readonly githubProjectsLoading = signal(false);
  protected readonly githubProjectsError = signal<string | null>(null);
  protected readonly safariHistory = signal<SafariHistoryEntry[]>([...this.safariPresetHistory]);
  protected readonly safariInput = signal('');
  protected readonly safariCurrentUrl = signal('');
  protected readonly safariFrameUrl = signal<SafeResourceUrl | null>(null);
  protected readonly safariFrameBlockedReason = signal<string | null>(null);
  protected readonly safariError = signal<string | null>(null);
  protected readonly contextMenu = signal<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    appId: null,
    fileName: null,
    items: []
  });
  protected readonly contextSubmenu = signal<ContextSubmenuState>({
    visible: false,
    x: 0,
    y: 0,
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
  private terminalGuessTarget: number | null = null;
  private terminalGuessAttempts = 0;
  private terminalGuessWins = 0;
  private terminalGuessLosses = 0;
  private readonly terminalGuessMaxAttempts = 5;
  private readonly terminalSnakeBoardSize = 12;
  private readonly terminalSnakeTickMs = 420;
  private terminalSnakeBody: SnakePosition[] | null = null;
  private terminalSnakeFood: SnakePosition | null = null;
  private terminalSnakeDirection: SnakeDirection = 'right';
  private terminalSnakeScore = 0;
  private terminalSnakeWins = 0;
  private terminalSnakeLosses = 0;
  private terminalSnakeBestScore = 0;
  private snakeTickIntervalId: number | null = null;
  private cursorBoostTimeoutId: number | null = null;
  private lastPointerSample: { x: number; y: number; time: number } | null = null;
  private readonly clockInterval = window.setInterval(() => {
    this.timeLabel.set(this.formatTime());
  }, 30000);

  constructor(private readonly sanitizer: DomSanitizer) {
    this.updateMobileAccessBlock();
    this.restoreQuizSecretFromStorage();
    this.restoreDesktopThemeFromStorage();
    this.restoreDockFromStorage();
    this.initializeSafari();
    this.openApp('about');
    this.beginBootSequence();
  }

  ngOnDestroy(): void {
    window.clearInterval(this.clockInterval);
    this.clearBootTimers();
    this.stopSnakeTicker();
    this.clearCursorBoost();
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

    this.openFile(item.fileName, item.content, item.attachments ?? []);
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
      { id: 'open-books', label: 'Abrir Books' },
      { id: 'open-courses', label: 'Abrir Courses' },
      { id: 'open-quiz', label: 'Abrir Quiz' },
      { id: 'open-safari', label: 'Abrir Safari' },
      { id: 'themes', label: 'Temas >' },
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

  protected onContextMenuItemEnter(item: ContextMenuItem, event: MouseEvent): void {
    if (item.id !== 'themes') {
      this.closeThemeSubmenu();
      return;
    }

    const target = event.currentTarget as HTMLElement | null;
    if (!target) {
      return;
    }

    const bounds = target.getBoundingClientRect();
    const submenuWidth = 184;
    const submenuHeight = 100;
    const margin = 6;
    const clampedX = Math.min(bounds.right + 4, window.innerWidth - submenuWidth - margin);
    const clampedY = Math.min(bounds.top - 2, window.innerHeight - submenuHeight - margin);

    this.contextSubmenu.set({
      visible: true,
      x: Math.max(margin, clampedX),
      y: Math.max(margin, clampedY),
      items: this.getThemeMenuItems()
    });
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
            this.openFile(item.fileName, item.content, item.attachments ?? []);
          }
        }
        break;
      case 'open-terminal':
        this.openApp('terminal');
        break;
      case 'open-books':
        this.openApp('books');
        break;
      case 'open-courses':
        this.openApp('courses');
        break;
      case 'open-quiz':
        this.openApp('quiz');
        break;
      case 'open-safari':
        this.openApp('safari');
        break;
      case 'reset-dock':
        this.dockAppIds.set([...this.defaultDockAppIds]);
        this.persistDockToStorage();
        break;
      case 'themes':
        break;
      case 'theme-classic':
        this.setDesktopTheme('classic');
        break;
      case 'theme-sunset':
        this.setDesktopTheme('sunset');
        break;
      case 'theme-grid':
        this.setDesktopTheme('grid');
        break;
      case 'theme-founder':
        if (this.isFounderSecretUnlocked()) {
          this.setDesktopTheme('founder');
        }
        break;
    }

    this.closeContextMenu();
  }

  protected closeContextMenu(): void {
    this.closeThemeSubmenu();
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

  protected closeThemeSubmenu(): void {
    if (!this.contextSubmenu().visible) {
      return;
    }

    this.contextSubmenu.set({
      visible: false,
      x: 0,
      y: 0,
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

  @HostListener('window:resize')
  protected onWindowResize(): void {
    this.updateMobileAccessBlock();
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
    if (appId === 'quiz') {
      return 'notes';
    }

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
      case 'courses':
        return 'Courses';
      case 'quiz':
        return 'Quiz';
      case 'safari':
        return 'Safari';
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

  protected isAboutMeFileOpen(): boolean {
    return this.openedFileName().toLowerCase() === 'about-me.txt';
  }

  protected handleQuizSecretUnlocked(): void {
    if (this.isFounderSecretUnlocked()) {
      return;
    }

    this.isFounderSecretUnlocked.set(true);
    this.isFounderUnlockNoticeVisible.set(true);
    this.persistQuizSecretToStorage();
    this.setDesktopTheme('founder');
    this.appendTerminalLines([
      '[secret] Perfect run detected.',
      '[secret] Hidden theme unlocked: Founder Mode.',
      '[secret] New command available: boot --founder'
    ]);
  }

  protected closeFounderUnlockNotice(): void {
    this.isFounderUnlockNoticeVisible.set(false);
  }

  protected updateSafariInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.safariInput.set(target?.value ?? '');
  }

  protected submitSafariNavigation(): void {
    this.navigateSafariTo(this.safariInput());
  }

  protected openSafariHistoryEntry(entryUrl: string): void {
    this.navigateSafariTo(entryUrl);
  }

  protected isSafariCurrentUrl(entryUrl: string): boolean {
    return this.safariCurrentUrl() === entryUrl;
  }

  protected updateTerminalInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.terminalInput.set(target?.value ?? '');
  }

  protected onTerminalKeydown(event: KeyboardEvent): void {
    if (this.isSnakeGameActive()) {
      const direction = this.parseSnakeDirection(event.key.toLowerCase().replace('arrow', ''));
      if (direction) {
        event.preventDefault();
        this.terminalSnakeDirection = this.getSafeSnakeDirection(
          direction,
          this.terminalSnakeDirection,
          this.terminalSnakeBody?.length ?? 0
        );
        return;
      }
    }

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
      if (this.isSnakeGameActive()) {
        this.finishSnakeGame('quit', 'Snake interrompido.');
      }
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

    if (this.handleGuessGameInput(sanitizedCommand)) {
      return;
    }
    if (this.handleSnakeGameInput(sanitizedCommand)) {
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
      case 'courses':
        this.openApp('courses');
        this.appendTerminalLines([
          'Courses.app opened with your completed certifications.'
        ]);
        return;
      case 'quiz':
        this.openApp('quiz');
        this.appendTerminalLines([
          'Quiz.app opened. Try to guess facts about Eduardo.'
        ]);
        return;
      case 'safari':
        this.openApp('safari');
        this.appendTerminalLines([
          'Safari.app opened with URL whitelist from search history.'
        ]);
        return;
      case 'ls':
      case 'dir':
        this.appendTerminalLines(this.getWorkspaceListingLines());
        return;
      case 'cat':
      case 'type':
        if (!argumentText) {
          this.appendTerminalLines(['Usage: cat <about-me.txt>']);
          return;
        }

        this.printTerminalFile(argumentText);
        return;
      case 'open':
        if (rest.length === 0) {
          this.appendTerminalLines(['Usage: open <finder|safari|notes|terminal|projects|books|courses|quiz|about|textviewer>']);
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
      case 'guess':
      case 'jogo':
        this.startGuessGame();
        return;
      case 'placar':
      case 'score':
        this.appendTerminalLines([
          `Guess score -> vitorias: ${this.terminalGuessWins} | derrotas: ${this.terminalGuessLosses}`
        ]);
        return;
      case 'snake':
      case 'cobrinha':
        this.startSnakeGame();
        return;
      case 'snake-score':
        this.appendTerminalLines([
          `Snake score -> vitorias: ${this.terminalSnakeWins} | derrotas: ${this.terminalSnakeLosses} | recorde: ${this.terminalSnakeBestScore}`
        ]);
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
      case 'boot':
        if (argumentText !== '--founder') {
          this.appendTerminalLines(['Usage: boot --founder']);
          return;
        }

        this.runFounderBootCommand();
        return;
      case 'clear':
      case 'cls':
        this.stopSnakeTicker();
        this.terminalSnakeBody = null;
        this.terminalSnakeFood = null;
        this.terminalSnakeBoard.set(null);
        this.terminalSnakeDirection = 'right';
        this.terminalSnakeScore = 0;
        this.terminalLines.set([]);
        return;
      default:
        this.appendTerminalLines([`Command not found: ${rawCommand}`]);
    }
  }

  private startGuessGame(): void {
    this.terminalGuessTarget = Math.floor(Math.random() * 20) + 1;
    this.terminalGuessAttempts = 0;
    this.appendTerminalLines([
      'Guess game iniciado.',
      `Adivinhe um numero de 1 a 20 em ${this.terminalGuessMaxAttempts} tentativas.`,
      'Digite um numero ou "desisto".'
    ]);
  }

  private handleGuessGameInput(rawInput: string): boolean {
    if (this.terminalGuessTarget === null) {
      return false;
    }

    const normalized = rawInput.toLowerCase();
    if (normalized === 'desisto' || normalized === 'exit' || normalized === 'quit') {
      this.terminalGuessTarget = null;
      this.terminalGuessLosses += 1;
      this.appendTerminalLines(['Jogo encerrado. Boa tentativa.']);
      return true;
    }

    if (!/^\d+$/.test(rawInput)) {
      this.appendTerminalLines(['Jogo ativo: digite um numero de 1 a 20 ou "desisto".']);
      return true;
    }

    const guessValue = Number(rawInput);
    if (guessValue < 1 || guessValue > 20) {
      this.appendTerminalLines(['Use um numero valido entre 1 e 20.']);
      return true;
    }

    this.terminalGuessAttempts += 1;

    if (guessValue === this.terminalGuessTarget) {
      this.terminalGuessWins += 1;
      this.appendTerminalLines([
        `Boa! Acertou em ${this.terminalGuessAttempts} tentativa(s).`,
        'Rode "guess" para jogar de novo.'
      ]);
      this.terminalGuessTarget = null;
      return true;
    }

    const hint = guessValue < this.terminalGuessTarget ? 'mais alto' : 'mais baixo';
    const attemptsLeft = this.terminalGuessMaxAttempts - this.terminalGuessAttempts;
    if (attemptsLeft <= 0) {
      this.terminalGuessLosses += 1;
      this.appendTerminalLines([
        `Fim de jogo. O numero era ${this.terminalGuessTarget}.`,
        'Rode "guess" para tentar novamente.'
      ]);
      this.terminalGuessTarget = null;
      return true;
    }

    this.appendTerminalLines([`Errou. Dica: tente um numero ${hint}. Restam ${attemptsLeft} tentativa(s).`]);
    return true;
  }

  private startSnakeGame(): void {
    this.stopSnakeTicker();
    const centerRow = Math.floor(this.terminalSnakeBoardSize / 2);
    this.terminalSnakeBody = [
      { x: 2, y: centerRow },
      { x: 1, y: centerRow },
      { x: 0, y: centerRow }
    ];
    this.terminalSnakeDirection = 'right';
    this.terminalSnakeScore = 0;
    this.terminalSnakeFood = this.generateSnakeFood(this.terminalSnakeBody);

    this.appendTerminalLines([
      'Snake iniciado em tempo real.',
      'Controles: setas ou w/a/s/d. Digite "quit" para sair.'
    ]);
    this.terminalSnakeBoard.set(this.getSnakeBoardLines());
    this.startSnakeTicker();
  }

  private handleSnakeGameInput(rawInput: string): boolean {
    if (!this.isSnakeGameActive()) {
      return false;
    }

    const normalized = rawInput.toLowerCase();
    if (normalized === 'quit' || normalized === 'exit' || normalized === 'sair' || normalized === 'desisto') {
      this.finishSnakeGame('quit', 'Snake encerrado.');
      return true;
    }

    if (normalized === 'help') {
      this.appendTerminalLines(['Snake ativo: use w/a/s/d para mover ou "quit" para sair.']);
      return true;
    }

    const direction = this.parseSnakeDirection(normalized);
    if (direction) {
      this.terminalSnakeDirection = this.getSafeSnakeDirection(
        direction,
        this.terminalSnakeDirection,
        this.terminalSnakeBody?.length ?? 0
      );
      return true;
    }

    return false;
  }

  private parseSnakeDirection(input: string): SnakeDirection | null {
    switch (input) {
      case 'w':
      case 'up':
        return 'up';
      case 'a':
      case 'left':
        return 'left';
      case 's':
      case 'down':
        return 'down';
      case 'd':
      case 'right':
        return 'right';
      default:
        return null;
    }
  }

  private advanceSnake(): void {
    if (!this.terminalSnakeBody || !this.terminalSnakeFood) {
      return;
    }

    const head = this.terminalSnakeBody[0];
    const nextHead = this.getNextSnakeHead(head, this.terminalSnakeDirection);

    if (
      nextHead.x < 0 ||
      nextHead.x >= this.terminalSnakeBoardSize ||
      nextHead.y < 0 ||
      nextHead.y >= this.terminalSnakeBoardSize ||
      this.terminalSnakeBody.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y)
    ) {
      this.finishSnakeGame('loss', `Game over. Pontuacao final: ${this.terminalSnakeScore}.`);
      return;
    }

    const ateFood = nextHead.x === this.terminalSnakeFood.x && nextHead.y === this.terminalSnakeFood.y;
    const nextBody = ateFood
      ? [nextHead, ...this.terminalSnakeBody]
      : [nextHead, ...this.terminalSnakeBody.slice(0, -1)];

    this.terminalSnakeBody = nextBody;
    if (ateFood) {
      this.terminalSnakeScore += 1;
      this.terminalSnakeFood = this.generateSnakeFood(nextBody);
      if (!this.terminalSnakeFood) {
        this.finishSnakeGame('win', `Perfeito. Tabuleiro completo! Pontuacao final: ${this.terminalSnakeScore}.`);
        return;
      }
    }

    this.terminalSnakeBoard.set(this.getSnakeBoardLines());
  }

  private getSafeSnakeDirection(
    requested: SnakeDirection,
    current: SnakeDirection,
    bodyLength: number
  ): SnakeDirection {
    if (bodyLength <= 1) {
      return requested;
    }

    const oppositeMap: Record<SnakeDirection, SnakeDirection> = {
      up: 'down',
      down: 'up',
      left: 'right',
      right: 'left'
    };

    if (oppositeMap[current] === requested) {
      return current;
    }

    return requested;
  }

  private getNextSnakeHead(head: SnakePosition, direction: SnakeDirection): SnakePosition {
    switch (direction) {
      case 'up':
        return { x: head.x, y: head.y - 1 };
      case 'down':
        return { x: head.x, y: head.y + 1 };
      case 'left':
        return { x: head.x - 1, y: head.y };
      case 'right':
        return { x: head.x + 1, y: head.y };
      default:
        return head;
    }
  }

  private generateSnakeFood(body: SnakePosition[]): SnakePosition | null {
    const occupied = new Set(body.map((segment) => `${segment.x}:${segment.y}`));
    const availableCells: SnakePosition[] = [];
    for (let y = 0; y < this.terminalSnakeBoardSize; y += 1) {
      for (let x = 0; x < this.terminalSnakeBoardSize; x += 1) {
        if (!occupied.has(`${x}:${y}`)) {
          availableCells.push({ x, y });
        }
      }
    }

    if (availableCells.length === 0) {
      return null;
    }

    const pickedIndex = Math.floor(Math.random() * availableCells.length);
    return availableCells[pickedIndex];
  }

  private getSnakeBoardLines(): string[] {
    if (!this.terminalSnakeBody || !this.terminalSnakeFood) {
      return ['Snake inativo. Rode "snake" para iniciar.'];
    }

    const segments = new Set(this.terminalSnakeBody.map((segment) => `${segment.x}:${segment.y}`));
    const head = this.terminalSnakeBody[0];
    const topBottomBorder = `+${'-'.repeat(this.terminalSnakeBoardSize)}+`;
    const rows: string[] = [];

    for (let y = 0; y < this.terminalSnakeBoardSize; y += 1) {
      let row = '|';
      for (let x = 0; x < this.terminalSnakeBoardSize; x += 1) {
        const key = `${x}:${y}`;
        if (x === head.x && y === head.y) {
          row += '@';
        } else if (x === this.terminalSnakeFood.x && y === this.terminalSnakeFood.y) {
          row += '*';
        } else if (segments.has(key)) {
          row += 'o';
        } else {
          row += '.';
        }
      }
      row += '|';
      rows.push(row);
    }

    return [
      `Snake score: ${this.terminalSnakeScore} | recorde: ${this.terminalSnakeBestScore}`,
      topBottomBorder,
      ...rows,
      topBottomBorder
    ];
  }

  private finishSnakeGame(result: 'win' | 'loss' | 'quit', message: string): void {
    if (!this.terminalSnakeBody) {
      return;
    }
    this.stopSnakeTicker();

    if (this.terminalSnakeScore > this.terminalSnakeBestScore) {
      this.terminalSnakeBestScore = this.terminalSnakeScore;
    }

    if (result === 'win') {
      this.terminalSnakeWins += 1;
    } else if (result === 'loss') {
      this.terminalSnakeLosses += 1;
    }

    this.appendTerminalLines([message, 'Rode "snake" para jogar novamente.']);
    this.terminalSnakeBody = null;
    this.terminalSnakeFood = null;
    this.terminalSnakeBoard.set(null);
    this.terminalSnakeDirection = 'right';
    this.terminalSnakeScore = 0;
  }

  private isSnakeGameActive(): boolean {
    return this.terminalSnakeBody !== null && this.terminalSnakeFood !== null;
  }

  private startSnakeTicker(): void {
    this.stopSnakeTicker();
    this.snakeTickIntervalId = window.setInterval(() => {
      this.advanceSnake();
    }, this.terminalSnakeTickMs);
  }

  private stopSnakeTicker(): void {
    if (this.snakeTickIntervalId !== null) {
      window.clearInterval(this.snakeTickIntervalId);
      this.snakeTickIntervalId = null;
    }
  }

  private initializeSafari(): void {
    const firstEntry = this.safariPresetHistory[0];
    if (!firstEntry) {
      return;
    }

    this.navigateSafariTo(firstEntry.url);
  }

  private navigateSafariTo(rawUrl: string): void {
    const normalizedUrl = normalizeBrowserUrl(rawUrl);
    if (!normalizedUrl) {
      this.safariFrameBlockedReason.set(null);
      this.safariError.set('Digite uma URL valida em formato http(s).');
      return;
    }

    const allowedEntry = this.safariAllowedUrlMap.get(normalizedUrl);
    if (!allowedEntry) {
      this.safariFrameBlockedReason.set(null);
      this.safariError.set('Por seguranca, o Safari virtual abre apenas URLs do historico permitido.');
      return;
    }

    this.safariInput.set(allowedEntry.url);
    this.safariCurrentUrl.set(allowedEntry.url);
    this.safariError.set(null);

    if (this.isSafariFrameBlockedByHost(allowedEntry.url)) {
      this.safariFrameUrl.set(null);
      this.safariFrameBlockedReason.set(
        'Este site bloqueia visualizacao em iframe por seguranca. Use "Nova aba".'
      );
      return;
    }

    this.safariFrameUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(allowedEntry.url));
    this.safariFrameBlockedReason.set(null);
  }

  private isSafariFrameBlockedByHost(rawUrl: string): boolean {
    try {
      const parsed = new URL(rawUrl);
      return this.safariIframeBlockedHosts.has(parsed.hostname.toLowerCase());
    } catch {
      return false;
    }
  }

  private openContextMenuAt(
    x: number,
    y: number,
    appId: AppId | null,
    fileName: string | null,
    items: ContextMenuItem[]
  ): void {
    this.closeThemeSubmenu();
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

  private setDesktopTheme(theme: DesktopTheme): void {
    if (theme === 'founder' && !this.isFounderSecretUnlocked()) {
      return;
    }

    this.desktopTheme.set(theme);
    this.persistDesktopThemeToStorage();
  }

  private updateMobileAccessBlock(): void {
    const blocked = window.innerWidth <= this.mobileLayoutMaxWidth;
    this.isMobileAccessBlocked.set(blocked);
    if (blocked) {
      this.closeContextMenu();
    }
  }

  private getThemeMenuItems(): ContextMenuItem[] {
    const items: ContextMenuItem[] = [
      { id: 'theme-classic', label: this.getThemeContextLabel('classic') },
      { id: 'theme-sunset', label: this.getThemeContextLabel('sunset') },
      { id: 'theme-grid', label: this.getThemeContextLabel('grid') }
    ];

    if (this.isFounderSecretUnlocked()) {
      items.push({ id: 'theme-founder', label: this.getThemeContextLabel('founder') });
    }

    return items;
  }

  private getThemeContextLabel(theme: DesktopTheme): string {
    const marker = this.desktopTheme() === theme ? '[x]' : '[ ]';
    switch (theme) {
      case 'classic':
        return `${marker} Tema classico`;
      case 'sunset':
        return `${marker} Tema sunset`;
      case 'grid':
        return `${marker} Tema grid`;
      case 'founder':
        return `${marker} Tema founder`;
      default:
        return `${marker} Tema`;
    }
  }

  private persistDesktopThemeToStorage(): void {
    try {
      localStorage.setItem(this.desktopThemeStorageKey, this.desktopTheme());
    } catch {
      // Ignore storage errors in private mode or blocked storage environments.
    }
  }

  private restoreDesktopThemeFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.desktopThemeStorageKey);
      if (raw === 'classic' || raw === 'sunset' || raw === 'grid') {
        this.desktopTheme.set(raw);
      } else if (raw === 'founder' && this.isFounderSecretUnlocked()) {
        this.desktopTheme.set(raw);
      }
    } catch {
      // Ignore malformed local storage payloads and keep defaults.
    }
  }

  private persistQuizSecretToStorage(): void {
    try {
      localStorage.setItem(this.quizSecretStorageKey, JSON.stringify(this.isFounderSecretUnlocked()));
    } catch {
      // Ignore storage errors in private mode or blocked storage environments.
    }
  }

  private restoreQuizSecretFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.quizSecretStorageKey);
      if (raw === 'true') {
        this.isFounderSecretUnlocked.set(true);
        return;
      }

      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw);
      if (parsed === true) {
        this.isFounderSecretUnlocked.set(true);
      }
    } catch {
      // Ignore malformed local storage payloads and keep defaults.
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

      const allowed = new Set<AppId>(['finder', 'safari', 'notes', 'terminal', 'projects', 'books', 'courses', 'quiz', 'about']);
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
        'Available apps: finder, safari, notes, terminal, projects, books, courses, quiz, about, textviewer'
      ]);
      return;
    }

    this.openApp(appId);
    this.appendTerminalLines([`Launching ${this.getWindowTitle(appId)}...`]);
  }

  private openFile(fileName: string, content: string, attachments: FileAttachment[] = []): void {
    this.openedFileName.set(fileName);
    this.openedFileContent.set(content);
    this.openedFileAttachments.set([...attachments]);
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

  private runFounderBootCommand(): void {
    if (!this.isFounderSecretUnlocked()) {
      this.appendTerminalLines([
        'boot: founder profile is locked.',
        'Tip: complete Quiz.app with zero mistakes.'
      ]);
      return;
    }

    this.setDesktopTheme('founder');
    this.appendTerminalLines([
      'lacOs Founder Boot v1.0',
      'Reading founder profile................... OK',
      'Linking purpose modules................... OK',
      'Loading respect, craft and consistency.... OK',
      "Welcome, visitor. You found Eduardo's secret boot."
    ]);
  }

  @HostListener('window:pointermove', ['$event'])
  protected onPointerMove(event: PointerEvent): void {
    this.trackCursorBoost(event);

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

  private trackCursorBoost(event: PointerEvent): void {
    const sampleTime = event.timeStamp || performance.now();
    if (!Number.isFinite(sampleTime)) {
      return;
    }

    if (!this.lastPointerSample) {
      this.lastPointerSample = { x: event.clientX, y: event.clientY, time: sampleTime };
      return;
    }

    const deltaX = event.clientX - this.lastPointerSample.x;
    const deltaY = event.clientY - this.lastPointerSample.y;
    const deltaTime = Math.max(1, sampleTime - this.lastPointerSample.time);
    const traveled = Math.hypot(deltaX, deltaY);
    const speed = (traveled * 1000) / deltaTime;

    if (speed >= this.cursorBoostSpeedThreshold) {
      this.enableCursorBoost();
    }

    this.lastPointerSample = { x: event.clientX, y: event.clientY, time: sampleTime };
  }

  private enableCursorBoost(): void {
    document.body.classList.add(this.cursorBoostClassName);

    if (this.cursorBoostTimeoutId !== null) {
      window.clearTimeout(this.cursorBoostTimeoutId);
    }

    this.cursorBoostTimeoutId = window.setTimeout(() => {
      document.body.classList.remove(this.cursorBoostClassName);
      this.cursorBoostTimeoutId = null;
    }, this.cursorBoostDurationMs);
  }

  private clearCursorBoost(): void {
    if (this.cursorBoostTimeoutId !== null) {
      window.clearTimeout(this.cursorBoostTimeoutId);
      this.cursorBoostTimeoutId = null;
    }

    this.lastPointerSample = null;
    document.body.classList.remove(this.cursorBoostClassName);
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
    const baseDimensions = (() => {
      switch (appId) {
      case 'safari':
        return { width: 700, height: 420 };
      case 'courses':
        return { width: 680, height: 400 };
      case 'quiz':
        return { width: 700, height: 420 };
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
    })();

    return {
      width: baseDimensions.width,
      height: baseDimensions.height + this.windowDefaultHeightBoost
    };
  }

  private getWindowMinimumDimensions(appId: AppId): { width: number; height: number } {
    const baseDimensions = (() => {
      switch (appId) {
      case 'safari':
        return { width: 520, height: 320 };
      case 'courses':
        return { width: 500, height: 300 };
      case 'quiz':
        return { width: 520, height: 320 };
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
    })();

    return {
      width: baseDimensions.width,
      height: baseDimensions.height + this.windowMinimumHeightBoost
    };
  }

  private getWindowTitle(appId: AppId): string {
    switch (appId) {
      case 'about':
        return 'Welcome.app';
      case 'safari':
        return 'Safari.app';
      case 'projects':
        return 'Projects.app';
      case 'books':
        return 'Books.app';
      case 'courses':
        return 'Courses.app';
      case 'quiz':
        return 'Quiz.app';
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
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date());
  }
}
