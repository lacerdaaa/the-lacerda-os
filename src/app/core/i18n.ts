import { computed, Injectable, Signal, signal } from '@angular/core';
import { readStorage, writeStorage } from './storage';

export type AppLanguage = 'en-US' | 'pt-BR';
export type Localized<T> = Record<AppLanguage, T>;
export type CopyDictionary<K extends string = string> = Record<K, Localized<string>>;

export const LANGUAGES: readonly AppLanguage[] = ['en-US', 'pt-BR'];
const LANGUAGE_STORAGE_KEY = 'lacos.app.language';

function isLanguage(value: unknown): value is AppLanguage {
  return value === 'en-US' || value === 'pt-BR';
}

/** Replaces `{name}` placeholders with the given params. */
export function format(template: string, params: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match
  );
}

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly languageState = signal<AppLanguage>(this.restoreLanguage());

  readonly language = this.languageState.asReadonly();

  setLanguage(language: AppLanguage): void {
    this.languageState.set(language);
    writeStorage(LANGUAGE_STORAGE_KEY, language);
  }

  pick<T>(value: Localized<T>): T {
    return value[this.languageState()];
  }

  /** Turns a bilingual dictionary into a reactive dictionary for the active language. */
  copy<K extends string>(dictionary: CopyDictionary<K>): Signal<Record<K, string>> {
    return computed(() => {
      const language = this.languageState();
      const entries = Object.entries(dictionary) as [K, Localized<string>][];
      return Object.fromEntries(entries.map(([key, value]) => [key, value[language]])) as Record<K, string>;
    });
  }

  private restoreLanguage(): AppLanguage {
    const stored = readStorage(LANGUAGE_STORAGE_KEY);
    if (isLanguage(stored)) {
      return stored;
    }

    const browserLanguage = typeof navigator !== 'undefined' ? navigator.language : '';
    return browserLanguage.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en-US';
  }
}
