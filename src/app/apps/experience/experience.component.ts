import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { I18nService } from '../../core/i18n';
import { EXPERIENCES } from '../../data/experience';

const COPY = {
  title: { 'en-US': 'Experience', 'pt-BR': 'Experiência' },
  subtitle: { 'en-US': 'My professional timeline.', 'pt-BR': 'Minha linha do tempo profissional.' }
};

@Component({
  selector: 'app-experience',
  template: `
    <h1 class="page-title">{{ copy().title }}</h1>
    <p class="page-meta">{{ copy().subtitle }}</p>
    <ol class="timeline">
      @for (item of experiences(); track item.title + item.period) {
        <li [class.current]="item.current">
          <article class="role">
            <header>
              <div>
                <h2>{{ item.title }}</h2>
                <p class="meta">{{ item.organization }} · {{ item.period }}</p>
              </div>
              <span class="badge">{{ item.status }}</span>
            </header>
            <p>{{ item.summary }}</p>
            <ul>
              @for (highlight of item.highlights; track $index) {
                <li>{{ highlight }}</li>
              }
            </ul>
          </article>
        </li>
      }
    </ol>
  `,
  styleUrl: './experience.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperienceComponent {
  private readonly i18n = inject(I18nService);
  protected readonly copy = this.i18n.copy(COPY);
  protected readonly experiences = computed(() => this.i18n.pick(EXPERIENCES));
}
