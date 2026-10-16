import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { isSeparator, MenuItem } from '../../core/menu';

/** A Platinum pull-down list. Used by the menu bar and by right-click context menus. */
@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'menu',
    '(click)': '$event.stopPropagation()'
  }
})
export class MenuComponent {
  readonly items = input.required<MenuItem[]>();
  /** Open submenus to the left (used when the menu sits near the right edge of the screen). */
  readonly flipSubmenus = input(false);
  /** Emitted after an action runs, so the owner can close the menu. */
  readonly done = output<void>();

  protected readonly openSubmenu = signal<number | null>(null);
  protected readonly isSeparator = isSeparator;

  protected onEnter(index: number, item: MenuItem): void {
    this.openSubmenu.set(item.submenu && !item.disabled ? index : null);
  }

  protected onSelect(index: number, item: MenuItem): void {
    if (item.disabled) {
      return;
    }

    if (item.submenu) {
      // Touch devices have no hover: toggle the submenu on tap.
      this.openSubmenu.update((open) => (open === index ? null : index));
      return;
    }

    item.action?.();
    this.done.emit();
  }
}
