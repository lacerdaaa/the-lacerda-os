import { inject, Injectable } from '@angular/core';
import { TextViewerService } from '../apps/text-viewer/text-viewer.service';
import { DesktopItem } from '../data/desktop';
import { FileId } from '../data/files';
import { PROFILE } from '../data/profile';
import { SHELL_COPY } from '../shell/shell.copy';
import { AppId, APPS } from './apps';
import { DesktopService, DesktopTheme } from './desktop.service';
import { AppLanguage, I18nService, LANGUAGES } from './i18n';
import { MENU_SEPARATOR, MenuItem } from './menu';
import { WindowManagerService } from './window-manager.service';

const THEME_LABEL_KEYS: Record<DesktopTheme, keyof typeof SHELL_COPY> = {
  classic: 'themeClassic',
  sunset: 'themeSunset',
  grid: 'themeGrid',
  founder: 'themeFounder'
};

const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  'en-US': 'English',
  'pt-BR': 'Português (Brasil)'
};

/** Order of apps in the "Go" menu and in Finder. */
export const LAUNCHABLE_APPS: readonly AppId[] = [
  'about',
  'experience',
  'projects',
  'courses',
  'books',
  'blog',
  'safari',
  'terminal',
  'notes',
  'quiz'
];

/** High-level desktop commands shared by the menu bar, context menus, the dock and the terminal. */
@Injectable({ providedIn: 'root' })
export class ShellService {
  private readonly windows = inject(WindowManagerService);
  private readonly desktop = inject(DesktopService);
  private readonly i18n = inject(I18nService);
  private readonly textViewer = inject(TextViewerService);
  private readonly copy = this.i18n.copy(SHELL_COPY);

  appName(appId: AppId): string {
    return this.i18n.pick(APPS[appId].name);
  }

  openApp(appId: AppId): void {
    this.windows.open(appId);
  }

  openFile(fileId: FileId): void {
    this.textViewer.show(fileId);
    this.windows.open('textviewer', { title: fileId });
  }

  openDesktopItem(item: DesktopItem): void {
    if (item.kind === 'app') {
      this.openApp(item.appId);
    } else {
      this.openFile(item.fileId);
    }
  }

  desktopItemName(item: DesktopItem): string {
    return item.kind === 'app' ? this.appName(item.appId) : item.fileId;
  }

  themeMenu(): MenuItem[] {
    return this.desktop.availableThemes().map((theme) => ({
      label: this.copy()[THEME_LABEL_KEYS[theme]],
      checked: this.desktop.theme() === theme,
      action: () => this.desktop.setTheme(theme)
    }));
  }

  languageMenu(): MenuItem[] {
    return LANGUAGES.map((language) => ({
      label: LANGUAGE_LABELS[language],
      checked: this.i18n.language() === language,
      action: () => this.i18n.setLanguage(language)
    }));
  }

  goMenu(): MenuItem[] {
    return [
      { label: this.appName('finder'), action: () => this.openApp('finder') },
      MENU_SEPARATOR,
      ...LAUNCHABLE_APPS.map((appId) => ({
        label: this.appName(appId),
        action: () => this.openApp(appId)
      }))
    ];
  }

  windowListMenu(): MenuItem[] {
    const active = this.windows.activeWindow();
    const open = this.windows.windows();
    if (open.length === 0) {
      return [{ label: this.copy().noWindows, disabled: true }];
    }

    return open.map((windowState) => ({
      label: windowState.title ?? this.appName(windowState.appId),
      checked: windowState.id === active?.id,
      action: () => this.openApp(windowState.appId)
    }));
  }

  desktopContextMenu(): MenuItem[] {
    return [
      { label: this.copy().openTerminal, action: () => this.openApp('terminal') },
      { label: this.copy().theme, submenu: this.themeMenu() },
      { label: this.copy().language, submenu: this.languageMenu() },
      MENU_SEPARATOR,
      { label: this.copy().resetDock, action: () => this.desktop.resetDock() }
    ];
  }

  appContextMenu(appId: AppId, options: { inDock?: boolean } = {}): MenuItem[] {
    const items: MenuItem[] = [
      {
        label: this.windows.isRunning(appId) && !options.inDock ? this.copy().bringToFront : this.copy().openApp,
        action: () => this.openApp(appId)
      }
    ];

    if (APPS[appId].dockable) {
      const pinned = this.desktop.isPinned(appId);
      items.push(
        pinned
          ? {
              label: this.copy().unpinFromDock,
              danger: true,
              disabled: this.desktop.dockAppIds().length <= 1,
              action: () => this.desktop.unpin(appId)
            }
          : { label: this.copy().pinToDock, action: () => this.desktop.pin(appId) }
      );
    }

    const running = this.windows.findByApp(appId);
    if (running) {
      items.push(MENU_SEPARATOR, { label: this.copy().quit, action: () => this.windows.close(running.id) });
    }

    return items;
  }

  fileContextMenu(fileId: FileId): MenuItem[] {
    return [{ label: this.copy().open, action: () => this.openFile(fileId) }];
  }

  copyProfileLink(): void {
    void navigator.clipboard?.writeText(PROFILE.githubUrl).catch(() => undefined);
  }
}
