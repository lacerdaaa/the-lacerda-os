import { Injectable, signal } from '@angular/core';
import { PROFILE } from '../../data/profile';
import { LoadState } from '../projects/github.service';

export interface BlogPost {
  title: string;
  link: string;
  pubDate: string;
  excerpt: string;
}

interface Rss2JsonResponse {
  status: string;
  items?: { title: string; link: string; pubDate: string; description?: string }[];
}

const OWN_FEED_URL = '/api/medium-feed';
const MEDIUM_FEED_URL = `https://medium.com/feed/${PROFILE.mediumUrl.split('/').pop()}`;
const FALLBACK_FEED_URL = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(MEDIUM_FEED_URL)}`;
const MAX_POSTS = 10;
const EXCERPT_LENGTH = 180;

function toExcerpt(html: string): string {
  const text = new DOMParser().parseFromString(html, 'text/html').body.textContent ?? '';
  const compact = text.replace(/\s+/g, ' ').trim();
  return compact.length > EXCERPT_LENGTH ? `${compact.slice(0, EXCERPT_LENGTH).trimEnd()}…` : compact;
}

export function parseMediumFeed(xml: string): BlogPost[] {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  return Array.from(doc.querySelectorAll('item'))
    .slice(0, MAX_POSTS)
    .map((item) => {
      const text = (tag: string) => item.getElementsByTagName(tag)[0]?.textContent?.trim() ?? '';
      return {
        title: text('title'),
        link: text('link'),
        pubDate: text('pubDate'),
        excerpt: toExcerpt(text('content:encoded') || text('description'))
      };
    })
    .filter((post) => post.title && post.link);
}

/**
 * Loads Medium posts through the site's own edge function (`api/medium-feed.ts`, only available on
 * Vercel) and falls back to a public RSS-to-JSON bridge, so the blog also works locally.
 */
@Injectable({ providedIn: 'root' })
export class BlogService {
  private readonly postsState = signal<BlogPost[]>([]);
  private readonly stateValue = signal<LoadState>('idle');

  readonly posts = this.postsState.asReadonly();
  readonly state = this.stateValue.asReadonly();

  async load(force = false): Promise<void> {
    const state = this.stateValue();
    if (state === 'loading' || (state === 'ready' && !force)) {
      return;
    }

    this.stateValue.set('loading');
    try {
      const posts = await this.fetchOwnFeed().catch(() => this.fetchFallbackFeed());
      this.postsState.set(posts);
      this.stateValue.set('ready');
    } catch {
      this.stateValue.set('error');
    }
  }

  private async fetchOwnFeed(): Promise<BlogPost[]> {
    const response = await fetch(OWN_FEED_URL);
    const type = response.headers.get('content-type') ?? '';
    if (!response.ok || !type.includes('xml')) {
      throw new Error(`Feed returned ${response.status}`);
    }
    return parseMediumFeed(await response.text());
  }

  private async fetchFallbackFeed(): Promise<BlogPost[]> {
    const response = await fetch(FALLBACK_FEED_URL);
    const body = (await response.json()) as Rss2JsonResponse;
    if (!response.ok || body.status !== 'ok' || !body.items) {
      throw new Error('Fallback feed unavailable');
    }
    return body.items.slice(0, MAX_POSTS).map((item) => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate.replace(' ', 'T') + 'Z',
      excerpt: toExcerpt(item.description ?? '')
    }));
  }
}
