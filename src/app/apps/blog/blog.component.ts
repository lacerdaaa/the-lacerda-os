import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { I18nService } from '../../core/i18n';
import { PROFILE } from '../../data/profile';
import { BlogService } from './blog.service';

const COPY = {
  title: { 'en-US': 'Blog', 'pt-BR': 'Blog' },
  subtitle: { 'en-US': 'Latest articles on', 'pt-BR': 'Artigos mais recentes no' },
  loading: { 'en-US': 'Fetching posts', 'pt-BR': 'Buscando posts' },
  error: { 'en-US': 'Could not load posts right now.', 'pt-BR': 'Não foi possível carregar os posts agora.' },
  retry: { 'en-US': 'Try Again', 'pt-BR': 'Tentar de Novo' },
  openMedium: { 'en-US': 'Read on Medium', 'pt-BR': 'Ler no Medium' },
  empty: { 'en-US': 'No posts yet. Stay tuned!', 'pt-BR': 'Nenhum post ainda. Em breve!' },
  read: { 'en-US': 'Read', 'pt-BR': 'Ler' }
};

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogComponent implements OnInit {
  private readonly i18n = inject(I18nService);
  protected readonly blog = inject(BlogService);
  protected readonly copy = this.i18n.copy(COPY);
  protected readonly profile = PROFILE;

  ngOnInit(): void {
    void this.blog.load();
  }

  protected formatDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? ''
      : new Intl.DateTimeFormat(this.i18n.language(), { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
  }
}
