import { Localized } from './i18n';

export type AppId =
  | 'about'
  | 'projects'
  | 'books'
  | 'courses'
  | 'experience'
  | 'quiz'
  | 'terminal'
  | 'notes'
  | 'finder'
  | 'textviewer'
  | 'safari'
  | 'blog';

export type IconKey = AppId | 'file';

export interface Size {
  width: number;
  height: number;
}

export interface AppDefinition {
  id: AppId;
  name: Localized<string>;
  icon: IconKey;
  /** Preferred size when the window opens. */
  size: Size;
  /** Smallest size the user can resize the window to. */
  minSize: Size;
  /** Whether the app can be pinned to the dock. */
  dockable: boolean;
}

function app(
  id: AppId,
  name: Localized<string>,
  size: Size,
  minSize: Size,
  options: Partial<Pick<AppDefinition, 'icon' | 'dockable'>> = {}
): AppDefinition {
  return { id, name, size, minSize, icon: options.icon ?? id, dockable: options.dockable ?? true };
}

export const APPS: Record<AppId, AppDefinition> = {
  about: app('about', { 'en-US': 'About Me', 'pt-BR': 'Sobre Mim' }, { width: 560, height: 440 }, { width: 340, height: 260 }),
  finder: app('finder', { 'en-US': 'Finder', 'pt-BR': 'Finder' }, { width: 620, height: 400 }, { width: 360, height: 260 }),
  experience: app('experience', { 'en-US': 'Experience', 'pt-BR': 'Experiência' }, { width: 660, height: 460 }, { width: 380, height: 280 }),
  projects: app('projects', { 'en-US': 'Projects', 'pt-BR': 'Projetos' }, { width: 660, height: 440 }, { width: 380, height: 280 }),
  courses: app('courses', { 'en-US': 'Courses', 'pt-BR': 'Cursos' }, { width: 660, height: 440 }, { width: 380, height: 280 }),
  books: app('books', { 'en-US': 'Books', 'pt-BR': 'Livros' }, { width: 620, height: 420 }, { width: 360, height: 280 }),
  blog: app('blog', { 'en-US': 'Blog', 'pt-BR': 'Blog' }, { width: 600, height: 420 }, { width: 360, height: 260 }),
  safari: app('safari', { 'en-US': 'Safari', 'pt-BR': 'Safari' }, { width: 760, height: 480 }, { width: 420, height: 320 }),
  terminal: app('terminal', { 'en-US': 'Terminal', 'pt-BR': 'Terminal' }, { width: 580, height: 380 }, { width: 360, height: 240 }),
  notes: app('notes', { 'en-US': 'Notes', 'pt-BR': 'Notas' }, { width: 420, height: 380 }, { width: 280, height: 220 }),
  quiz: app('quiz', { 'en-US': 'Quiz', 'pt-BR': 'Quiz' }, { width: 640, height: 480 }, { width: 360, height: 300 }),
  textviewer: app(
    'textviewer',
    { 'en-US': 'SimpleText', 'pt-BR': 'SimpleText' },
    { width: 560, height: 440 },
    { width: 320, height: 240 },
    { icon: 'file', dockable: false }
  )
};

export const APP_IDS = Object.keys(APPS) as AppId[];

export function isAppId(value: unknown): value is AppId {
  return typeof value === 'string' && value in APPS;
}
