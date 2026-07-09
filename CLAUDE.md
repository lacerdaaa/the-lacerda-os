# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # dev server at http://localhost:4200
npm run build      # production build → dist/
npm test           # run tests with Vitest via Angular CLI
```

To run a single test file:
```bash
npx ng test --include="**/app.spec.ts"
```

## Architecture

This is a single-page Angular 21 app that simulates a macOS-style desktop ("lacOs"). There is **no routing** — the entire app lives in one component tree rooted at `App` (`src/app/app.ts`).

### Component structure

- **`App`** (`src/app/app.ts`) — the only stateful component. Contains all business logic, all content data, and all window/dock/desktop management. ~1 200+ lines.
- **`AboutQuizComponent`** (`src/app/about-quiz/`) — the only extracted sub-component. Hosts the personal quiz and emits `secretUnlocked` when the user answers all questions correctly with no mistakes. The parent listens to this event to unlock the `founder` desktop theme.

### Window system

Each "app" is identified by the `AppId` union type. Opening an app creates a `WindowState` entry in the `windows` signal. Windows are draggable, resizable, minimizable, and maximizable — all managed by `dragState` / `resizeState` private fields and pointer event handlers.

### Adding a new app

1. Add the id to the `AppId` union type.
2. Add an entry to `appRegistry`.
3. Handle it in `app.html` inside the `@for (windowState of windows())` block.
4. Optionally add it to `defaultDockAppIds` or `workspaceItems`.

### Content data pattern

All personal content (books, experience, courses, bio paragraphs) is declared as `private readonly` class fields in `App`, keyed by `AppLanguage` (`'en-US' | 'pt-BR'`). The active language is a signal (`currentLanguage`). To update personal data, edit the corresponding `*ByLanguage` record directly in `app.ts`.

### External data

GitHub projects are the only live-fetched data (`loadGithubProjects`), pulled from the public GitHub API. Everything else is static.

### Safari (in-app browser)

The in-app Safari window renders URLs in an iframe. Two lists control what renders:
- `safariIframeBlockedHosts` — domains that refuse to be iframed (always shows an error).
- `safariAllowedUrlMap` / `safariPresetHistoryByLanguage` — preset bookmarks shown in the history panel.

### Storage

`localStorage` keys are all prefixed with `lacos.` (e.g. `lacos.dock.apps`, `lacos.desktop.theme`, `lacos.app.language`, `lacos.quiz.secret.unlocked`).

### Secret / Easter egg

Completing the quiz (`AboutQuizComponent`) with zero wrong answers emits `secretUnlocked`, which sets a localStorage flag and unlocks the `founder` desktop theme via a boot animation.
