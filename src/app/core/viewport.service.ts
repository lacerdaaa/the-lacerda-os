import { DestroyRef, inject, Injectable, signal } from '@angular/core';

/** Below this width the desktop switches to a touch-friendly, full-screen window layout. */
export const COMPACT_MAX_WIDTH = 760;

@Injectable({ providedIn: 'root' })
export class ViewportService {
  private readonly compactState = signal(this.measureCompact());

  /** True on phones and narrow windows: windows fill the screen and icons open with a single tap. */
  readonly isCompact = this.compactState.asReadonly();

  constructor() {
    const onResize = () => this.compactState.set(this.measureCompact());
    window.addEventListener('resize', onResize);
    inject(DestroyRef).onDestroy(() => window.removeEventListener('resize', onResize));
  }

  /** Re-reads the viewport; useful after programmatic size changes (tests, orientation changes). */
  refresh(): void {
    this.compactState.set(this.measureCompact());
  }

  private measureCompact(): boolean {
    return window.innerWidth <= COMPACT_MAX_WIDTH;
  }
}
