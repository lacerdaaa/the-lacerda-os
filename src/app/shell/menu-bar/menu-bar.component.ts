import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { TerminalService } from '../../apps/terminal/terminal.service';
import { DesktopService } from '../../core/desktop.service';
import { AppLanguage, I18nService } from '../../core/i18n';
import { MENU_SEPARATOR, MenuItem } from '../../core/menu';
import { ShellService } from '../../core/shell.service';
import { ViewportService } from '../../core/viewport.service';
import { WindowManagerService } from '../../core/window-manager.service';
import { PROFILE } from '../../data/profile';
import { MenuComponent } from '../menu/menu.component';
import { SHELL_COPY } from '../shell.copy';

interface MenuBarEntry {
  id: string;
  label: string;
  items: MenuItem[];
  strong?: boolean;
  logo?: boolean;
}

const CLOCK_TICK_MS = 5_000;

@Component({
  selector: 'app-menu-bar',
  imports: [MenuComponent],
  templateUrl: './menu-bar.component.html',
  styleUrl: './menu-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'menubar',
    '(document:click)': 'closeMenus()',
    '(document:keydown.escape)': 'closeMenus()'
  }
})
export class MenuBarComponent {
  private readonly i18n = inject(I18nService);
  private readonly shell = inject(ShellService);
  private readonly windows = inject(WindowManagerService);
  private readonly desktop = inject(DesktopService);
  private readonly terminal = inject(TerminalService);
  protected readonly viewport = inject(ViewportService);
  protected readonly copy = this.i18n.copy(SHELL_COPY);
  protected readonly language = this.i18n.language;

  protected readonly openMenuId = signal<string | null>(null);
  private readonly now = signal(new Date());

  protected readonly clock = computed(() =>
    new Intl.DateTimeFormat(this.language(), { weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(this.now())
  );

  protected readonly activeAppName = computed(() => {
    const appId = this.windows.activeAppId();
    return appId ? this.shell.appName(appId) : 'Finder';
  });

  /** Menus are rebuilt reactively, so labels, check marks and window lists stay current. */
  protected readonly menus = computed<MenuBarEntry[]>(() => {
    const copy = this.copy();
    const active = this.windows.activeWindow();
    const fileMenu: MenuItem[] = [
      { label: copy.openFile, action: () => this.shell.openFile('about-me.txt') },
      MENU_SEPARATOR,
      { label: copy.closeWindow, disabled: !active, action: () => active && this.windows.close(active.id) }
    ];
    const editMenu: MenuItem[] = [
      { label: copy.undo, disabled: true, hint: '⌘Z' },
      MENU_SEPARATOR,
      { label: copy.cut, disabled: true, hint: '⌘X' },
      { label: copy.copy, disabled: true, hint: '⌘C' },
      { label: copy.paste, disabled: true, hint: '⌘V' },
      MENU_SEPARATOR,
      { label: copy.copyProfileLink, action: () => this.shell.copyProfileLink() }
    ];
    const viewMenu: MenuItem[] = [
      { label: copy.theme, submenu: this.shell.themeMenu() },
      { label: copy.language, submenu: this.shell.languageMenu() }
    ];
    const windowMenu: MenuItem[] = [
      { label: copy.minimize, disabled: !active, action: () => active && this.windows.minimize(active.id) },
      { label: copy.zoom, disabled: !active || this.viewport.isCompact(), action: () => active && this.windows.toggleMaximize(active.id) },
      { label: copy.collapse, disabled: !active || this.viewport.isCompact(), action: () => active && this.windows.toggleShade(active.id) },
      MENU_SEPARATOR,
      ...this.shell.windowListMenu()
    ];
    const helpMenu: MenuItem[] = [
      { label: copy.readme, action: () => this.shell.openFile('readme.txt') },
      { label: copy.terminalHelp, action: () => this.showTerminalHelp() },
      MENU_SEPARATOR,
      { label: copy.viewSource, action: () => window.open(`${PROFILE.githubUrl}/the-lacerda-os`, '_blank', 'noopener') }
    ];
    const systemMenu: MenuItem[] = [
      { label: copy.aboutLacos, action: () => this.shell.openApp('about') },
      MENU_SEPARATOR,
      ...this.shell.goMenu().slice(2),
      MENU_SEPARATOR,
      { label: copy.restart, action: () => this.desktop.restart() }
    ];

    if (this.viewport.isCompact()) {
      return [
        {
          id: 'system',
          label: 'lacOs',
          logo: true,
          items: [
            ...systemMenu.slice(0, 2),
            { label: copy.go, submenu: this.shell.goMenu() },
            { label: copy.view, submenu: viewMenu },
            { label: copy.window, submenu: windowMenu },
            { label: copy.help, submenu: helpMenu },
            MENU_SEPARATOR,
            systemMenu[systemMenu.length - 1]
          ]
        },
        { id: 'app', label: this.activeAppName(), strong: true, items: this.appMenu() }
      ];
    }

    return [
      { id: 'system', label: 'lacOs', logo: true, items: systemMenu },
      { id: 'app', label: this.activeAppName(), strong: true, items: this.appMenu() },
      { id: 'file', label: copy.file, items: fileMenu },
      { id: 'edit', label: copy.edit, items: editMenu },
      { id: 'view', label: copy.view, items: viewMenu },
      { id: 'go', label: copy.go, items: this.shell.goMenu() },
      { id: 'window', label: copy.window, items: windowMenu },
      { id: 'help', label: copy.help, items: helpMenu }
    ];
  });

  constructor() {
    const timer = window.setInterval(() => this.now.set(new Date()), CLOCK_TICK_MS);
    inject(DestroyRef).onDestroy(() => window.clearInterval(timer));
  }

  protected toggleMenu(id: string, event: MouseEvent): void {
    event.stopPropagation();
    this.openMenuId.update((open) => (open === id ? null : id));
  }

  /** Mac behavior: once a menu is open, sliding across the bar switches menus. */
  protected hoverMenu(id: string): void {
    if (this.openMenuId() !== null) {
      this.openMenuId.set(id);
    }
  }

  protected closeMenus(): void {
    this.openMenuId.set(null);
  }

  protected setLanguage(language: AppLanguage, event: MouseEvent): void {
    event.stopPropagation();
    this.i18n.setLanguage(language);
  }

  private appMenu(): MenuItem[] {
    const active = this.windows.activeWindow();
    if (!active) {
      return [{ label: this.copy().aboutLacos, action: () => this.shell.openApp('about') }];
    }

    return [
      { label: this.copy().hide, action: () => this.windows.minimize(active.id) },
      MENU_SEPARATOR,
      { label: `${this.copy().quit} ${this.shell.appName(active.appId)}`, action: () => this.windows.close(active.id) }
    ];
  }

  private showTerminalHelp(): void {
    this.shell.openApp('terminal');
    this.terminal.run('help');
  }
}
