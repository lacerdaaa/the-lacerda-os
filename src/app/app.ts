import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject } from '@angular/core';
import { DesktopService } from './core/desktop.service';
import { installCursorBoost } from './core/cursor-boost';
import { I18nService } from './core/i18n';
import { ContextMenuService } from './core/menu';
import { ViewportService } from './core/viewport.service';
import { WindowManagerService } from './core/window-manager.service';
import { AlertDialogComponent } from './shell/alert-dialog/alert-dialog.component';
import { BootScreenComponent } from './shell/boot-screen/boot-screen.component';
import { DesktopComponent } from './shell/desktop/desktop.component';
import { MenuBarComponent } from './shell/menu-bar/menu-bar.component';
import { MenuComponent } from './shell/menu/menu.component';
import { SHELL_COPY } from './shell/shell.copy';

/** Root of lacOs: composes the menu bar, the desktop and the system overlays. */
@Component({
  selector: 'app-root',
  imports: [AlertDialogComponent, BootScreenComponent, DesktopComponent, MenuBarComponent, MenuComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.compact]': 'viewport.isCompact()',
    '(document:click)': 'contextMenu.close()',
    '(document:keydown.escape)': 'contextMenu.close()'
  }
})
export class App {
  protected readonly desktop = inject(DesktopService);
  protected readonly viewport = inject(ViewportService);
  protected readonly contextMenu = inject(ContextMenuService);
  protected readonly copy = inject(I18nService).copy(SHELL_COPY);
  private readonly windows = inject(WindowManagerService);
  private readonly i18n = inject(I18nService);

  constructor() {
    // Greet visitors with the profile, like a "Read Me" that opens on startup.
    this.windows.open('about');

    effect(() => {
      document.documentElement.lang = this.i18n.language();
    });

    inject(DestroyRef).onDestroy(installCursorBoost());
  }
}
