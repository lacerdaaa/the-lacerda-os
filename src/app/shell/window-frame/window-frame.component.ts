import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { I18nService } from '../../core/i18n';
import { ContextMenuService } from '../../core/menu';
import { ShellService } from '../../core/shell.service';
import { ViewportService } from '../../core/viewport.service';
import { WindowManagerService, WindowState } from '../../core/window-manager.service';
import { SHELL_COPY } from '../shell.copy';

interface PointerSession {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
}

@Component({
  selector: 'app-window-frame',
  templateUrl: './window-frame.component.html',
  styleUrl: './window-frame.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'dialog',
    '[attr.aria-label]': 'title()',
    '[class.active]': 'isActive()',
    '[class.maximized]': 'window().maximized',
    '[class.shaded]': 'window().shaded',
    '[class.minimized]': 'window().minimized',
    '[class.compact]': 'viewport.isCompact()',
    '[class.dragging]': 'dragging()',
    '[style.left.px]': 'window().x',
    '[style.top.px]': 'window().y',
    '[style.width.px]': 'window().width',
    '[style.height.px]': 'window().shaded ? null : window().height',
    '[style.z-index]': 'window().z',
    '(pointerdown)': 'focus()'
  }
})
export class WindowFrameComponent {
  readonly window = input.required<WindowState>();
  /** Content that should sit flush with the frame (e.g. the terminal) instead of on a white page. */
  readonly flush = input(false);

  protected readonly viewport = inject(ViewportService);
  private readonly windows = inject(WindowManagerService);
  private readonly shell = inject(ShellService);
  private readonly contextMenu = inject(ContextMenuService);
  protected readonly copy = inject(I18nService).copy(SHELL_COPY);

  protected readonly isActive = computed(() => this.windows.activeWindow()?.id === this.window().id);
  protected readonly title = computed(() => this.window().title ?? this.shell.appName(this.window().appId));

  protected readonly dragging = signal(false);
  private drag: PointerSession | null = null;
  private resize: PointerSession | null = null;

  protected focus(): void {
    this.windows.focus(this.window().id);
  }

  protected close(): void {
    this.windows.close(this.window().id);
  }

  protected minimize(): void {
    this.windows.minimize(this.window().id);
  }

  protected toggleMaximize(): void {
    this.windows.toggleMaximize(this.window().id);
  }

  protected toggleShade(event: MouseEvent): void {
    if (this.viewport.isCompact() || (event.target as HTMLElement).closest('button')) {
      return;
    }
    this.windows.toggleShade(this.window().id);
  }

  protected openTitleMenu(event: MouseEvent): void {
    this.contextMenu.openAt(event, [
      { label: this.copy().minimize, action: () => this.minimize() },
      { label: this.window().maximized ? this.copy().restoreBox : this.copy().zoom, action: () => this.toggleMaximize() },
      { label: this.copy().collapse, checked: this.window().shaded, action: () => this.windows.toggleShade(this.window().id) },
      ...this.shell.appContextMenu(this.window().appId)
    ]);
  }

  protected startDrag(event: PointerEvent): void {
    const target = event.target as HTMLElement;
    if (event.button !== 0 || this.viewport.isCompact() || this.window().maximized || target.closest('button')) {
      return;
    }
    this.drag = this.beginPointerSession(event, this.window().x, this.window().y);
    this.dragging.set(true);
  }

  protected startResize(event: PointerEvent): void {
    event.stopPropagation();
    if (event.button !== 0 || this.window().maximized) {
      return;
    }
    this.focus();
    this.resize = this.beginPointerSession(event, this.window().width, this.window().height);
  }

  protected onPointerMove(event: PointerEvent): void {
    if (this.drag?.pointerId === event.pointerId) {
      const { originX, originY, startX, startY } = this.drag;
      this.windows.moveTo(this.window().id, originX + event.clientX - startX, originY + event.clientY - startY);
    } else if (this.resize?.pointerId === event.pointerId) {
      const { originX, originY, startX, startY } = this.resize;
      this.windows.resizeTo(this.window().id, originX + event.clientX - startX, originY + event.clientY - startY);
    }
  }

  protected endPointerSession(): void {
    this.drag = null;
    this.resize = null;
    this.dragging.set(false);
  }

  private beginPointerSession(event: PointerEvent, originX: number, originY: number): PointerSession {
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    return { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX, originY };
  }
}
