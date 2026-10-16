import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  viewChild
} from '@angular/core';
import { I18nService } from '../../core/i18n';
import { SnakeDirection } from './games/snake-game';
import { TERMINAL_COPY } from './terminal.copy';
import { TERMINAL_PROMPT, TerminalService } from './terminal.service';

@Component({
  selector: 'app-terminal',
  templateUrl: './terminal.component.html',
  styleUrl: './terminal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TerminalComponent implements OnDestroy {
  protected readonly terminal = inject(TerminalService);
  protected readonly copy = inject(I18nService).copy(TERMINAL_COPY);
  protected readonly prompt = TERMINAL_PROMPT;
  protected readonly directions: { direction: SnakeDirection; label: string }[] = [
    { direction: 'up', label: '▲' },
    { direction: 'left', label: '◀' },
    { direction: 'down', label: '▼' },
    { direction: 'right', label: '▶' }
  ];

  private readonly output = viewChild.required<ElementRef<HTMLElement>>('output');
  private readonly inputField = viewChild.required<ElementRef<HTMLInputElement>>('inputField');

  constructor() {
    // Keep the newest output in view, like a real terminal.
    afterRenderEffect(() => {
      this.terminal.lines();
      this.terminal.snakeBoard();
      const element = this.output().nativeElement;
      element.scrollTop = element.scrollHeight;
    });
  }

  ngOnDestroy(): void {
    this.terminal.suspend();
  }

  protected onInput(event: Event): void {
    this.terminal.setInput((event.target as HTMLInputElement).value);
  }

  protected focusInput(): void {
    if (!window.getSelection()?.toString()) {
      this.inputField().nativeElement.focus();
    }
  }
}
