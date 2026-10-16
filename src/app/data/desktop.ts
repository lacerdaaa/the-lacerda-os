import { AppId } from '../core/apps';
import { FileId } from './files';

export type DesktopItem =
  | { kind: 'app'; appId: AppId; column: number; row: number }
  | { kind: 'file'; fileId: FileId; column: number; row: number };

/** Icons laid out on the desktop, in a column/row grid (1-based). */
export const DESKTOP_ITEMS: DesktopItem[] = [
  { kind: 'app', appId: 'finder', column: 1, row: 1 },
  { kind: 'app', appId: 'experience', column: 1, row: 2 },
  { kind: 'app', appId: 'projects', column: 1, row: 3 },
  { kind: 'app', appId: 'courses', column: 1, row: 4 },
  { kind: 'app', appId: 'books', column: 1, row: 5 },
  { kind: 'app', appId: 'terminal', column: 1, row: 6 },
  { kind: 'file', fileId: 'about-me.txt', column: 2, row: 1 },
  { kind: 'file', fileId: 'readme.txt', column: 2, row: 2 },
  { kind: 'app', appId: 'safari', column: 2, row: 3 },
  { kind: 'app', appId: 'blog', column: 2, row: 4 },
  { kind: 'app', appId: 'quiz', column: 2, row: 5 },
  { kind: 'app', appId: 'notes', column: 2, row: 6 }
];
