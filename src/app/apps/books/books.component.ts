import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { I18nService } from '../../core/i18n';
import { BOOKS } from '../../data/books';

const COPY = {
  title: { 'en-US': 'Bookshelf', 'pt-BR': 'Estante' },
  subtitle: { 'en-US': 'Books that shaped how I think, in and out of code.', 'pt-BR': 'Livros que moldaram meu jeito de pensar, dentro e fora do código.' }
};

@Component({
  selector: 'app-books',
  template: `
    <h1 class="page-title">{{ copy().title }}</h1>
    <p class="page-meta">{{ copy().subtitle }}</p>
    <div class="grid">
      @for (book of books(); track book.cover) {
        <article class="book">
          <img [src]="book.cover" [alt]="book.title" loading="lazy" />
          <div>
            <h2>{{ book.title }}</h2>
            <p>{{ book.description }}</p>
          </div>
        </article>
      }
    </div>
  `,
  styleUrl: './books.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BooksComponent {
  private readonly i18n = inject(I18nService);
  protected readonly copy = this.i18n.copy(COPY);
  protected readonly books = computed(() => this.i18n.pick(BOOKS));
}
