import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { format, I18nService } from '../../core/i18n';
import { COURSES } from '../../data/courses';

const COPY = {
  title: { 'en-US': 'Courses & Certifications', 'pt-BR': 'Cursos e Certificações' },
  subtitle: { 'en-US': '{count} completed, newest first.', 'pt-BR': '{count} concluídos, mais recentes primeiro.' },
  issued: { 'en-US': 'Issued', 'pt-BR': 'Emitido em' },
  skills: { 'en-US': 'Skills', 'pt-BR': 'Competências' },
  credential: { 'en-US': 'Credential', 'pt-BR': 'Credencial' }
};

@Component({
  selector: 'app-courses',
  template: `
    <h1 class="page-title">{{ copy().title }}</h1>
    <p class="page-meta">{{ subtitle() }}</p>
    <div class="list">
      @for (course of courses(); track course.title) {
        <article class="course">
          <img [src]="course.logo" [alt]="course.organization" loading="lazy" />
          <div>
            <h2>{{ course.title }}</h2>
            <p class="meta">{{ course.organization }} · {{ copy().issued }} {{ course.issuedAt }}</p>
            <p>{{ course.summary }}</p>
            <p class="skills"><strong>{{ copy().skills }}:</strong> {{ course.skills }}</p>
            @if (course.credentialCode) {
              <p class="credential">{{ copy().credential }}: <code>{{ course.credentialCode }}</code></p>
            }
          </div>
        </article>
      }
    </div>
  `,
  styleUrl: './courses.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CoursesComponent {
  private readonly i18n = inject(I18nService);
  protected readonly copy = this.i18n.copy(COPY);
  protected readonly courses = computed(() => this.i18n.pick(COURSES));
  protected readonly subtitle = computed(() => format(this.copy().subtitle, { count: this.courses().length }));
}
