import { Injectable, signal } from '@angular/core';
import { AppId, APPS, isAppId } from './apps';
import { readJsonStorage, readStorage, writeJsonStorage, writeStorage } from './storage';

export type DesktopTheme = 'classic' | 'sunset' | 'grid' | 'founder';

export const DESKTOP_THEMES: readonly DesktopTheme[] = ['classic', 'sunset', 'grid', 'founder'];
export const DEFAULT_DOCK_APPS: readonly AppId[] = ['finder', 'about', 'projects', 'terminal', 'quiz', 'safari'];

const DOCK_STORAGE_KEY = 'lacos.dock.apps';
const THEME_STORAGE_KEY = 'lacos.desktop.theme';
const SECRET_STORAGE_KEY = 'lacos.quiz.secret.unlocked';

function isAppIdList(value: unknown): value is AppId[] {
  return Array.isArray(value) && value.every(isAppId);
}

/** Desktop-wide preferences: wallpaper theme, dock contents, the founder secret and the boot state. */
@Injectable({ providedIn: 'root' })
export class DesktopService {
  private readonly founderUnlockedState = signal(this.restoreFounderSecret());
  private readonly themeState = signal<DesktopTheme>(this.restoreTheme());
  private readonly dockState = signal<AppId[]>(this.restoreDock());
  private readonly bootingState = signal(true);
  private readonly founderNoticeState = signal(false);

  readonly founderUnlocked = this.founderUnlockedState.asReadonly();
  readonly theme = this.themeState.asReadonly();
  readonly dockAppIds = this.dockState.asReadonly();
  readonly booting = this.bootingState.asReadonly();
  readonly founderNoticeVisible = this.founderNoticeState.asReadonly();

  availableThemes(): DesktopTheme[] {
    return DESKTOP_THEMES.filter((theme) => theme !== 'founder' || this.founderUnlockedState());
  }

  setTheme(theme: DesktopTheme): void {
    if (theme === 'founder' && !this.founderUnlockedState()) {
      return;
    }
    this.themeState.set(theme);
    writeStorage(THEME_STORAGE_KEY, theme);
  }

  /** Returns true the first time the secret is unlocked. */
  unlockFounderSecret(): boolean {
    if (this.founderUnlockedState()) {
      return false;
    }
    this.founderUnlockedState.set(true);
    writeJsonStorage(SECRET_STORAGE_KEY, true);
    this.founderNoticeState.set(true);
    this.setTheme('founder');
    return true;
  }

  dismissFounderNotice(): void {
    this.founderNoticeState.set(false);
  }

  isPinned(appId: AppId): boolean {
    return this.dockState().includes(appId);
  }

  pin(appId: AppId): void {
    if (!APPS[appId].dockable || this.isPinned(appId)) {
      return;
    }
    this.updateDock([...this.dockState(), appId]);
  }

  unpin(appId: AppId): void {
    if (!this.isPinned(appId) || this.dockState().length <= 1) {
      return;
    }
    this.updateDock(this.dockState().filter((id) => id !== appId));
  }

  resetDock(): void {
    this.updateDock([...DEFAULT_DOCK_APPS]);
  }

  restart(): void {
    this.bootingState.set(true);
  }

  finishBoot(): void {
    this.bootingState.set(false);
  }

  private updateDock(appIds: AppId[]): void {
    this.dockState.set(appIds);
    writeJsonStorage(DOCK_STORAGE_KEY, appIds);
  }

  private restoreFounderSecret(): boolean {
    return readStorage(SECRET_STORAGE_KEY) === 'true';
  }

  private restoreTheme(): DesktopTheme {
    const stored = readStorage(THEME_STORAGE_KEY);
    const isKnown = DESKTOP_THEMES.includes(stored as DesktopTheme);
    if (!isKnown || (stored === 'founder' && !this.founderUnlockedState())) {
      return 'classic';
    }
    return stored as DesktopTheme;
  }

  private restoreDock(): AppId[] {
    const stored = readJsonStorage(DOCK_STORAGE_KEY, isAppIdList)?.filter((appId) => APPS[appId].dockable);
    return stored && stored.length > 0 ? stored : [...DEFAULT_DOCK_APPS];
  }
}
