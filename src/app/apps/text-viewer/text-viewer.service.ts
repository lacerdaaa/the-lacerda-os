import { computed, inject, Injectable, signal } from '@angular/core';
import { I18nService } from '../../core/i18n';
import { FileId, FILES } from '../../data/files';

/** Tracks which desktop file SimpleText is showing; content follows the active language. */
@Injectable({ providedIn: 'root' })
export class TextViewerService {
  private readonly i18n = inject(I18nService);
  private readonly fileIdState = signal<FileId>('about-me.txt');

  readonly fileId = this.fileIdState.asReadonly();
  readonly file = computed(() => FILES[this.fileIdState()]);
  readonly content = computed(() => this.file().content(this.i18n.language()));

  show(fileId: FileId): void {
    this.fileIdState.set(fileId);
  }
}
