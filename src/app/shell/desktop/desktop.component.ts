import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, signal } from '@angular/core';
import { AboutComponent } from '../../apps/about/about.component';
import { BlogComponent } from '../../apps/blog/blog.component';
import { BooksComponent } from '../../apps/books/books.component';
import { CoursesComponent } from '../../apps/courses/courses.component';
import { ExperienceComponent } from '../../apps/experience/experience.component';
import { FinderComponent } from '../../apps/finder/finder.component';
import { NotesComponent } from '../../apps/notes/notes.component';
import { ProjectsComponent } from '../../apps/projects/projects.component';
import { QuizComponent } from '../../apps/quiz/quiz.component';
import { SafariComponent } from '../../apps/safari/safari.component';
import { TerminalComponent } from '../../apps/terminal/terminal.component';
import { TerminalService } from '../../apps/terminal/terminal.service';
import { TextViewerComponent } from '../../apps/text-viewer/text-viewer.component';
import { AppId, IconKey } from '../../core/apps';
import { DesktopService } from '../../core/desktop.service';
import { ContextMenuService } from '../../core/menu';
import { ShellService } from '../../core/shell.service';
import { ViewportService } from '../../core/viewport.service';
import { WindowManagerService } from '../../core/window-manager.service';
import { DESKTOP_ITEMS, DesktopItem } from '../../data/desktop';
import { AppIconComponent } from '../app-icon/app-icon.component';
import { DockComponent } from '../dock/dock.component';
import { WindowFrameComponent } from '../window-frame/window-frame.component';

/** Apps whose content fills the window edge to edge instead of sitting on a padded white page. */
const FLUSH_APPS = new Set<AppId>(['terminal', 'safari', 'notes']);

@Component({
  selector: 'app-desktop',
  imports: [
    AppIconComponent,
    DockComponent,
    WindowFrameComponent,
    AboutComponent,
    BlogComponent,
    BooksComponent,
    CoursesComponent,
    ExperienceComponent,
    FinderComponent,
    NotesComponent,
    ProjectsComponent,
    QuizComponent,
    SafariComponent,
    TerminalComponent,
    TextViewerComponent
  ],
  templateUrl: './desktop.component.html',
  styleUrl: './desktop.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-theme]': 'desktop.theme()',
    '[class.compact]': 'viewport.isCompact()',
    '(click)': 'selectedItem.set(null)',
    '(contextmenu)': 'openDesktopMenu($event)'
  }
})
export class DesktopComponent {
  protected readonly desktop = inject(DesktopService);
  protected readonly viewport = inject(ViewportService);
  protected readonly windows = inject(WindowManagerService);
  protected readonly shell = inject(ShellService);
  private readonly contextMenu = inject(ContextMenuService);
  private readonly terminal = inject(TerminalService);

  protected readonly items = DESKTOP_ITEMS;
  protected readonly selectedItem = signal<DesktopItem | null>(null);
  private lastPointerType = 'mouse';

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      this.windows.setLayerSize({ width: Math.round(width), height: Math.round(height) });
    });
    observer.observe(host);
    inject(DestroyRef).onDestroy(() => observer.disconnect());
  }

  protected iconFor(item: DesktopItem): IconKey {
    return item.kind === 'app' ? item.appId : 'file';
  }

  protected isFlush(appId: AppId): boolean {
    return FLUSH_APPS.has(appId);
  }

  protected rememberPointer(event: PointerEvent): void {
    this.lastPointerType = event.pointerType;
  }

  /**
   * Mac behavior: a click selects an icon and a double-click opens it. Touch screens and the
   * keyboard (Enter/Space produce a click with detail 0) open with a single activation.
   */
  protected onItemClick(item: DesktopItem, event: MouseEvent): void {
    event.stopPropagation();
    const opensImmediately = this.viewport.isCompact() || this.lastPointerType !== 'mouse' || event.detail === 0;
    if (opensImmediately) {
      this.open(item);
    } else {
      this.selectedItem.set(item);
    }
  }

  protected open(item: DesktopItem): void {
    this.selectedItem.set(null);
    this.shell.openDesktopItem(item);
  }

  protected openItemMenu(item: DesktopItem, event: MouseEvent): void {
    this.selectedItem.set(item);
    this.contextMenu.openAt(event, item.kind === 'app' ? this.shell.appContextMenu(item.appId) : this.shell.fileContextMenu(item.fileId));
  }

  protected openDesktopMenu(event: MouseEvent): void {
    this.contextMenu.openAt(event, this.shell.desktopContextMenu());
  }

  protected onSecretUnlocked(): void {
    if (this.desktop.unlockFounderSecret()) {
      this.terminal.announceFounderSecret();
    }
  }
}
