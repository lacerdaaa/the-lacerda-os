/**
 * Thin wrappers around localStorage that never throw: storage can be unavailable
 * (private mode, blocked cookies) and the desktop must keep working without it.
 */
export function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage errors in private mode or blocked storage environments.
  }
}

export function readJsonStorage<T>(key: string, isValid: (value: unknown) => value is T): T | null {
  const raw = readStorage(key);
  if (raw === null) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeJsonStorage(key: string, value: unknown): void {
  writeStorage(key, JSON.stringify(value));
}
