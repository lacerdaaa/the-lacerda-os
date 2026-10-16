import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconKey } from '../../core/apps';

/** Pixel-style 32×32 icons drawn as inline SVG so they stay crisp at any size. */
@Component({
  selector: 'app-icon',
  templateUrl: './app-icon.component.html',
  styleUrl: './app-icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
    'aria-hidden': 'true'
  }
})
export class AppIconComponent {
  readonly icon = input.required<IconKey>();
  readonly size = input(32);
}
