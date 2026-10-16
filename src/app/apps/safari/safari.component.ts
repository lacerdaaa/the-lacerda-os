import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { I18nService } from '../../core/i18n';
import { Bookmark, BOOKMARKS, findBookmark, normalizeUrl } from '../../data/bookmarks';

/** What the content area shows: the Favorites start page, a bookmark, or a URL outside the bookmarks. */
export type SafariPage =
  | { kind: 'favorites' }
  | { kind: 'bookmark'; bookmark: Bookmark }
  | { kind: 'external'; url: string };

const COPY = {
  back: { 'en-US': 'Back', 'pt-BR': 'Voltar' },
  forward: { 'en-US': 'Forward', 'pt-BR': 'Avançar' },
  home: { 'en-US': 'Favorites', 'pt-BR': 'Favoritos' },
  address: { 'en-US': 'Address', 'pt-BR': 'Endereço' },
  placeholder: { 'en-US': 'Search bookmarks or enter a URL', 'pt-BR': 'Busque nos favoritos ou digite uma URL' },
  go: { 'en-US': 'Go', 'pt-BR': 'Ir' },
  newTab: { 'en-US': 'Open in New Tab', 'pt-BR': 'Abrir em Nova Aba' },
  bookmarks: { 'en-US': 'Bookmarks', 'pt-BR': 'Favoritos' },
  favoritesTitle: { 'en-US': 'Favorites', 'pt-BR': 'Favoritos' },
  favoritesHint: {
    'en-US': 'A few corners of the web I keep coming back to.',
    'pt-BR': 'Alguns cantos da web aos quais eu sempre volto.'
  },
  blocked: {
    'en-US': 'This site does not allow being shown inside other pages, so here is a preview instead.',
    'pt-BR': 'Este site não permite ser exibido dentro de outras páginas, então aqui vai uma prévia.'
  },
  external: {
    'en-US': 'This retro Safari only renders my bookmarks inside the window. You can still open this address in a real tab.',
    'pt-BR': 'Este Safari retrô só exibe meus favoritos dentro da janela. Você ainda pode abrir este endereço em uma aba de verdade.'
  },
  invalid: { 'en-US': 'Enter a valid http(s) address.', 'pt-BR': 'Digite um endereço http(s) válido.' }
};

@Component({
  selector: 'app-safari',
  templateUrl: './safari.component.html',
  styleUrl: './safari.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SafariComponent {
  private readonly i18n = inject(I18nService);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly copy = this.i18n.copy(COPY);
  protected readonly bookmarks = BOOKMARKS;

  readonly page = signal<SafariPage>({ kind: 'favorites' });
  readonly address = signal('');
  readonly error = signal<string | null>(null);
  private readonly backStack = signal<SafariPage[]>([]);
  private readonly forwardStack = signal<SafariPage[]>([]);

  protected readonly canGoBack = computed(() => this.backStack().length > 0);
  protected readonly canGoForward = computed(() => this.forwardStack().length > 0);
  protected readonly currentUrl = computed(() => urlOf(this.page()));
  protected readonly frameUrl = computed<SafeResourceUrl | null>(() => {
    const page = this.page();
    return page.kind === 'bookmark' && page.bookmark.embeddable
      ? this.sanitizer.bypassSecurityTrustResourceUrl(page.bookmark.url)
      : null;
  });

  protected note(bookmark: Bookmark): string {
    return this.i18n.pick(bookmark.note);
  }

  protected hostOf(url: string): string {
    return new URL(url).host.replace(/^www\./, '');
  }

  protected onAddressInput(event: Event): void {
    this.address.set((event.target as HTMLInputElement).value);
  }

  submitAddress(): void {
    const query = this.address().trim();
    const byName = BOOKMARKS.find((bookmark) => bookmark.label.toLowerCase() === query.toLowerCase());
    const bookmark = byName ?? findBookmark(query);
    if (bookmark) {
      this.open(bookmark);
      return;
    }

    const url = normalizeUrl(query);
    if (!url || !url.includes('.')) {
      this.error.set(this.copy().invalid);
      return;
    }
    this.navigate({ kind: 'external', url });
  }

  open(bookmark: Bookmark): void {
    this.navigate({ kind: 'bookmark', bookmark });
  }

  showFavorites(): void {
    this.navigate({ kind: 'favorites' });
  }

  back(): void {
    const previous = this.backStack().at(-1);
    if (previous) {
      this.backStack.update((stack) => stack.slice(0, -1));
      this.forwardStack.update((stack) => [...stack, this.page()]);
      this.show(previous);
    }
  }

  forward(): void {
    const next = this.forwardStack().at(-1);
    if (next) {
      this.forwardStack.update((stack) => stack.slice(0, -1));
      this.backStack.update((stack) => [...stack, this.page()]);
      this.show(next);
    }
  }

  protected isCurrent(bookmark: Bookmark): boolean {
    const page = this.page();
    return page.kind === 'bookmark' && page.bookmark.id === bookmark.id;
  }

  private navigate(page: SafariPage): void {
    if (urlOf(page) === urlOf(this.page())) {
      this.show(page);
      return;
    }
    this.backStack.update((stack) => [...stack, this.page()]);
    this.forwardStack.set([]);
    this.show(page);
  }

  private show(page: SafariPage): void {
    this.page.set(page);
    this.address.set(urlOf(page));
    this.error.set(null);
  }
}

function urlOf(page: SafariPage): string {
  switch (page.kind) {
    case 'bookmark':
      return page.bookmark.url;
    case 'external':
      return page.url;
    default:
      return '';
  }
}
