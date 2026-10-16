import { Localized } from '../core/i18n';
import { PROFILE } from './profile';

export interface Bookmark {
  id: string;
  label: string;
  url: string;
  note: Localized<string>;
  /** Sites that refuse to be embedded (X-Frame-Options / CSP) open as a preview card instead. */
  embeddable: boolean;
}

export const BOOKMARKS: Bookmark[] = [
  {
    id: 'nodejs',
    label: 'Node.js',
    url: 'https://nodejs.org/en',
    note: { 'en-US': 'Official Node.js website.', 'pt-BR': 'Site oficial do Node.js.' },
    embeddable: true
  },
  {
    id: 'ddd-wikipedia',
    label: 'Domain-Driven Design',
    url: 'https://en.wikipedia.org/wiki/Domain-driven_design',
    note: { 'en-US': 'An overview of DDD on Wikipedia.', 'pt-BR': 'Visão geral de DDD na Wikipédia.' },
    embeddable: true
  },
  {
    id: 'ddd-community',
    label: 'DDD Community',
    url: 'https://dddcommunity.org',
    note: { 'en-US': 'Domain-Driven Design content and references.', 'pt-BR': 'Conteúdo sobre Domain-Driven Design.' },
    embeddable: true
  },
  {
    id: 'design-patterns',
    label: 'Design Patterns',
    url: 'https://refactoring.guru/design-patterns',
    note: { 'en-US': 'A practical catalog of software design patterns.', 'pt-BR': 'Catálogo prático de padrões de design.' },
    embeddable: false
  },
  {
    id: 'npm',
    label: 'npm',
    url: 'https://www.npmjs.com',
    note: { 'en-US': 'Package manager for the Node ecosystem.', 'pt-BR': 'Gerenciador de pacotes do ecossistema Node.' },
    embeddable: false
  },
  {
    id: 'github',
    label: 'GitHub',
    url: PROFILE.githubUrl,
    note: { 'en-US': 'My repositories and contributions.', 'pt-BR': 'Meus repositórios e contribuições.' },
    embeddable: false
  },
  {
    id: 'medium',
    label: 'Medium',
    url: PROFILE.mediumUrl,
    note: { 'en-US': 'Articles I have written.', 'pt-BR': 'Artigos que escrevi.' },
    embeddable: false
  }
];

/**
 * Normalizes user input into a comparable absolute URL: adds https://, drops the hash and
 * trailing slashes. Returns null for anything that is not http(s).
 */
export function normalizeUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null;
    }
    const path = parsed.pathname.replace(/\/+$/, '');
    return `${parsed.protocol}//${parsed.host.toLowerCase()}${path}${parsed.search}`;
  } catch {
    return null;
  }
}

export function findBookmark(rawUrl: string): Bookmark | undefined {
  const normalized = normalizeUrl(rawUrl);
  return normalized === null ? undefined : BOOKMARKS.find((bookmark) => normalizeUrl(bookmark.url) === normalized);
}
