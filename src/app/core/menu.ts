import { Injectable, signal } from '@angular/core';

export interface MenuItem {
  label: string;
  action?: () => void;
  submenu?: MenuItem[];
  checked?: boolean;
  disabled?: boolean;
  danger?: boolean;
  /** Purely informative keyboard hint shown on the right, Mac style. */
  hint?: string;
}

/** A thin rule between groups of menu items. */
export const MENU_SEPARATOR: MenuItem = { label: '-' };

export function isSeparator(item: MenuItem): boolean {
  return item === MENU_SEPARATOR;
}

export interface ContextMenuState {
  x: number;
  y: number;
  items: MenuItem[];
}

const MENU_WIDTH = 200;
const ITEM_HEIGHT = 22;
const VIEWPORT_MARGIN = 6;

/** Holds the single right-click menu that can be open at a time. */
@Injectable({ providedIn: 'root' })
export class ContextMenuService {
  private readonly state = signal<ContextMenuState | null>(null);

  readonly menu = this.state.asReadonly();

  openAt(event: MouseEvent, items: MenuItem[]): void {
    event.preventDefault();
    event.stopPropagation();

    const estimatedHeight = items.length * ITEM_HEIGHT + 8;
    const x = Math.min(event.clientX, window.innerWidth - MENU_WIDTH - VIEWPORT_MARGIN);
    const y = Math.min(event.clientY, window.innerHeight - estimatedHeight - VIEWPORT_MARGIN);
    this.state.set({ x: Math.max(VIEWPORT_MARGIN, x), y: Math.max(VIEWPORT_MARGIN, y), items });
  }

  close(): void {
    if (this.state() !== null) {
      this.state.set(null);
    }
  }
}
