import { afterNextRender, ChangeDetectionStrategy, Component, ElementRef, input, output, viewChild } from '@angular/core';

/** Modal Mac alert: icon on the left, message, and a default button on the right. */
@Component({
  selector: 'app-alert-dialog',
  template: `
    <div class="alert" role="alertdialog" aria-modal="true" aria-labelledby="alert-title" aria-describedby="alert-body">
      <div class="badge" aria-hidden="true">!</div>
      <div class="content">
        <h2 id="alert-title">{{ heading() }}</h2>
        <p id="alert-body">{{ message() }}</p>
        <div class="actions">
          <button #confirm type="button" class="push-button default" (click)="confirmed.emit()">{{ confirmLabel() }}</button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './alert-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'confirmed.emit()' }
})
export class AlertDialogComponent {
  readonly heading = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input('OK');
  readonly confirmed = output<void>();

  private readonly confirmButton = viewChild.required<ElementRef<HTMLButtonElement>>('confirm');

  constructor() {
    afterNextRender(() => this.confirmButton().nativeElement.focus());
  }
}
