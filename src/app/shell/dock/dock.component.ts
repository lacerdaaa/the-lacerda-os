import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AppId } from '../../core/apps';
import { DesktopService } from '../../core/desktop.service';
import { I18nService } from '../../core/i18n';
import { ContextMenuService } from '../../core/menu';
import { ShellService } from '../../core/shell.service';
import { WindowManagerService } from '../../core/window-manager.service';
import { AppIconComponent } from '../app-icon/app-icon.component';
import { SHELL_COPY } from '../shell.copy';

@Component({
  selector: 'app-dock',
  imports: [AppIconComponent],
  template: `
    <nav class="dock" [attr.aria-label]="copy().dock">
      @for (appId of desktop.dockAppIds(); track appId) {
        <button
          type="button"
          class="dock-item"
          [class.running]="windows.isRunning(appId)"
          [class.active]="windows.activeAppId() === appId"
          [class.minimized]="windows.isMinimized(appId)"
          [attr.aria-label]="shell.appName(appId)"
          (click)="shell.openApp(appId)"
          (contextmenu)="openMenu(appId, $event)"
        >
          <app-icon [icon]="appId" [size]="32" />
          <span class="label">{{ shell.appName(appId) }}</span>
        </button>
      }
    </nav>
  `,
  styleUrl: './dock.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DockComponent {
  protected readonly desktop = inject(DesktopService);
  protected readonly windows = inject(WindowManagerService);
  protected readonly shell = inject(ShellService);
  protected readonly copy = inject(I18nService).copy(SHELL_COPY);
  private readonly contextMenu = inject(ContextMenuService);

  protected openMenu(appId: AppId, event: MouseEvent): void {
    this.contextMenu.openAt(event, this.shell.appContextMenu(appId, { inDock: true }));
  }
}
