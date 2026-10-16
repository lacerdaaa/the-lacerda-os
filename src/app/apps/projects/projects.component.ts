import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { I18nService } from '../../core/i18n';
import { PROFILE } from '../../data/profile';
import { GithubService } from './github.service';

const COPY = {
  title: { 'en-US': 'Featured Projects', 'pt-BR': 'Projetos em Destaque' },
  liveFrom: { 'en-US': 'Live from', 'pt-BR': 'Ao vivo de' },
  loading: { 'en-US': 'Loading repositories from GitHub', 'pt-BR': 'Carregando repositórios do GitHub' },
  error: { 'en-US': 'Could not reach GitHub right now.', 'pt-BR': 'Não foi possível acessar o GitHub agora.' },
  retry: { 'en-US': 'Try Again', 'pt-BR': 'Tentar de Novo' },
  openGithub: { 'en-US': 'Open GitHub', 'pt-BR': 'Abrir GitHub' },
  empty: { 'en-US': 'No public repositories yet.', 'pt-BR': 'Nenhum repositório público ainda.' },
  pinned: { 'en-US': 'Pinned', 'pt-BR': 'Fixado' },
  updated: { 'en-US': 'Updated', 'pt-BR': 'Atualizado' },
  noDescription: { 'en-US': 'No description yet.', 'pt-BR': 'Sem descrição ainda.' },
  demo: { 'en-US': 'Live demo', 'pt-BR': 'Demo' }
};

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectsComponent implements OnInit {
  private readonly i18n = inject(I18nService);
  protected readonly github = inject(GithubService);
  protected readonly copy = this.i18n.copy(COPY);
  protected readonly profile = PROFILE;

  ngOnInit(): void {
    void this.github.load();
  }

  protected formatDate(value: string): string {
    return new Intl.DateTimeFormat(this.i18n.language(), { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value));
  }
}
