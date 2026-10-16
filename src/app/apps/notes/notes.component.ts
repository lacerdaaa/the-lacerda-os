import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { format, I18nService, Localized } from '../../core/i18n';
import { readStorage, writeStorage } from '../../core/storage';

const NOTES_STORAGE_KEY = 'lacos.notes';
const SAVE_DELAY_MS = 400;

const WELCOME_NOTE: Localized<string> = {
  'en-US': 'Hi! This is a real notepad.\n\nWhatever you type here stays saved in your browser, even after you close the window or reload the page.\n\n- Leave yourself a reminder\n- Draft feedback about this portfolio\n- Or just doodle',
  'pt-BR': 'Oi! Este é um bloco de notas de verdade.\n\nO que você digitar aqui fica salvo no seu navegador, mesmo fechando a janela ou recarregando a página.\n\n- Deixe um lembrete\n- Rascunhe um feedback sobre o portfólio\n- Ou só rabisque'
};

const COPY = {
  label: { 'en-US': 'Note', 'pt-BR': 'Nota' },
  saved: { 'en-US': 'Saved', 'pt-BR': 'Salvo' },
  saving: { 'en-US': 'Saving…', 'pt-BR': 'Salvando…' },
  characters: { 'en-US': '{count} characters', 'pt-BR': '{count} caracteres' },
  clear: { 'en-US': 'Clear', 'pt-BR': 'Limpar' }
};

@Component({
  selector: 'app-notes',
  template: `
    <textarea
      [attr.aria-label]="copy().label"
      [value]="text()"
      (input)="onInput($event)"
      spellcheck="true"
    ></textarea>
    <footer>
      <span>{{ status() }} · {{ count() }}</span>
      <button type="button" class="push-button" (click)="clear()">{{ copy().clear }}</button>
    </footer>
  `,
  styleUrl: './notes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotesComponent {
  private readonly i18n = inject(I18nService);
  protected readonly copy = this.i18n.copy(COPY);
  protected readonly text = signal(readStorage(NOTES_STORAGE_KEY) ?? this.i18n.pick(WELCOME_NOTE));
  private readonly dirty = signal(false);
  private saveTimer: number | null = null;

  protected readonly status = computed(() => (this.dirty() ? this.copy().saving : this.copy().saved));
  protected readonly count = computed(() => format(this.copy().characters, { count: this.text().length }));

  constructor() {
    inject(DestroyRef).onDestroy(() => this.flush());
  }

  protected onInput(event: Event): void {
    this.text.set((event.target as HTMLTextAreaElement).value);
    this.dirty.set(true);
    if (this.saveTimer !== null) {
      window.clearTimeout(this.saveTimer);
    }
    this.saveTimer = window.setTimeout(() => this.flush(), SAVE_DELAY_MS);
  }

  protected clear(): void {
    this.text.set('');
    this.flush();
  }

  private flush(): void {
    if (this.saveTimer !== null) {
      window.clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    writeStorage(NOTES_STORAGE_KEY, this.text());
    this.dirty.set(false);
  }
}
