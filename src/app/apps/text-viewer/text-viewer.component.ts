import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../../core/i18n';
import { TextViewerService } from './text-viewer.service';

const COPY = {
  attachments: { 'en-US': 'Attachments', 'pt-BR': 'Anexos' }
};

@Component({
  selector: 'app-text-viewer',
  template: `
    <pre class="document">{{ viewer.content() }}</pre>
    @if (viewer.file().attachments.length > 0) {
      <section class="attachments" [attr.aria-label]="copy().attachments">
        <h2>{{ copy().attachments }}</h2>
        <div class="grid">
          @for (attachment of viewer.file().attachments; track attachment.src) {
            <a class="card attachment" [href]="attachment.src" target="_blank" rel="noopener">
              <img [src]="attachment.src" alt="" loading="lazy" />
              <span>{{ attachment.label }}</span>
            </a>
          }
        </div>
      </section>
    }
  `,
  styleUrl: './text-viewer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextViewerComponent {
  protected readonly viewer = inject(TextViewerService);
  protected readonly copy = inject(I18nService).copy(COPY);
}
