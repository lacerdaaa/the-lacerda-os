import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { I18nService } from '../../core/i18n';
import { ShellService } from '../../core/shell.service';
import { PROFILE, PROFILE_PARAGRAPHS, SKILLS } from '../../data/profile';

const COPY = {
  heading: { 'en-US': 'about me', 'pt-BR': 'sobre mim' },
  skills: { 'en-US': 'Daily toolbox', 'pt-BR': 'Ferramentas do dia a dia' },
  experience: { 'en-US': 'Experience', 'pt-BR': 'Experiência' },
  projects: { 'en-US': 'Projects', 'pt-BR': 'Projetos' },
  tip: {
    'en-US': 'Tip: double-click the desktop icons (or tap them on a phone) to explore the rest.',
    'pt-BR': 'Dica: dê dois cliques nos ícones da mesa (ou toque neles no celular) para explorar o resto.'
  }
};

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutComponent {
  private readonly i18n = inject(I18nService);
  protected readonly shell = inject(ShellService);
  protected readonly copy = this.i18n.copy(COPY);
  protected readonly profile = PROFILE;
  protected readonly skills = SKILLS;
  protected readonly role = computed(() => this.i18n.pick(PROFILE.role));
  protected readonly location = computed(() => this.i18n.pick(PROFILE.location));
  protected readonly paragraphs = computed(() => this.i18n.pick(PROFILE_PARAGRAPHS));
  protected readonly initials = PROFILE.name
    .split(' ')
    .map((part) => part[0])
    .join('');
}
