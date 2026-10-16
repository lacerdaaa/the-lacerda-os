import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, output, signal } from '@angular/core';
import { IconKey } from '../../core/apps';
import { I18nService } from '../../core/i18n';
import { AppIconComponent } from '../app-icon/app-icon.component';

const COPY = {
  welcome: { 'en-US': 'Welcome to lacOs', 'pt-BR': 'Bem-vindo ao lacOs' },
  starting: { 'en-US': 'Starting up…', 'pt-BR': 'Iniciando…' },
  skip: { 'en-US': 'Click anywhere to skip', 'pt-BR': 'Clique em qualquer lugar para pular' }
};

/** Time on the "Happy Mac" screen before the welcome dialog shows up. */
const HAPPY_MAC_MS = 700;
const TOTAL_MS = 2600;
const PARADE: IconKey[] = ['finder', 'about', 'experience', 'projects', 'courses', 'books', 'blog', 'safari', 'terminal', 'notes', 'quiz'];

/** Classic Mac startup: Happy Mac, then "Welcome to lacOs" with a progress bar and the extension icon parade. */
@Component({
  selector: 'app-boot-screen',
  imports: [AppIconComponent],
  templateUrl: './boot-screen.component.html',
  styleUrl: './boot-screen.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'status',
    '[attr.aria-label]': 'copy().starting',
    '(click)': 'finish()',
    '(document:keydown)': 'finish()'
  }
})
export class BootScreenComponent {
  readonly done = output<void>();

  protected readonly copy = inject(I18nService).copy(COPY);
  private readonly elapsed = signal(0);
  private finished = false;

  protected readonly showWelcome = computed(() => this.elapsed() >= HAPPY_MAC_MS);
  protected readonly progress = computed(() =>
    Math.min(1, Math.max(0, (this.elapsed() - HAPPY_MAC_MS) / (TOTAL_MS - HAPPY_MAC_MS - 200)))
  );
  protected readonly percent = computed(() => Math.round(this.progress() * 100));
  protected readonly parade = computed(() => PARADE.slice(0, Math.ceil(this.progress() * PARADE.length)));

  constructor() {
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      this.elapsed.set(now - start);
      if (now - start >= TOTAL_MS) {
        this.finish();
      } else {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    inject(DestroyRef).onDestroy(() => cancelAnimationFrame(frame));
  }

  finish(): void {
    if (!this.finished) {
      this.finished = true;
      this.done.emit();
    }
  }
}
