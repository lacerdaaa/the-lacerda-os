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
npx ng test --include="**/terminal.service.spec.ts"
```

## Architecture

Single-page Angular 21 app (standalone, zoneless, signals, OnPush) that simulates a Mac OS 8 "Platinum" desktop called lacOs. There is **no routing**.

```
src/app/
  app.ts            root: menu bar + desktop + overlays (boot screen, context menu, alerts)
  core/             state and domain logic, no UI
    apps.ts               AppId union + APPS registry (names, icons, default/min sizes, dockable)
    window-manager.service.ts   windows signal: open/focus/close/minimize/zoom/shade/move/resize
    desktop.service.ts    theme, dock, founder secret, boot state (persisted)
    shell.service.ts      high-level commands + menu builders shared by menu bar, dock, icons, terminal
    i18n.ts               AppLanguage, Localized<T>, I18nService (pick / copy dictionaries)
    menu.ts               MenuItem model + ContextMenuService
    viewport.service.ts   isCompact (≤ 760px): full-screen windows, single tap
    storage.ts            never-throwing localStorage helpers
  data/             personal content (profile, books, experience, courses, bookmarks, files, desktop layout)
  shell/            OS chrome components (menu-bar, desktop, window-frame, dock, menu, boot-screen, alert-dialog, app-icon)
  apps/             one folder per app (about, finder, projects, blog, books, courses, experience, safari, terminal, notes, quiz, text-viewer)
src/styles/_retro.scss   shared Platinum mixins (`@use 'retro' as *;` works from any component)
```

### Adding a new app

1. Add the id to `AppId` and an entry to `APPS` in `core/apps.ts` (add an icon case in `shell/app-icon`).
2. Create the component in `apps/<name>/`.
3. Render it in the `@switch` of `shell/desktop/desktop.component.html` (add to `FLUSH_APPS` if it should fill the window edge to edge).
4. Optionally list it in `LAUNCHABLE_APPS` (Go menu / Finder), `DESKTOP_ITEMS`, `DEFAULT_DOCK_APPS` and the terminal `APP_ALIASES`.

### Content and translations

Personal content lives in `src/app/data/*.ts` as `Localized<T>` records (`'en-US' | 'pt-BR'`). UI strings live next to their component as `COPY` dictionaries consumed with `i18n.copy(COPY)`; shell-wide strings are in `shell/shell.copy.ts`.

### External data

- Projects: GitHub public API (`apps/projects/github.service.ts`).
- Blog: `/api/medium-feed` (Vercel edge function in `api/`), with a public RSS-to-JSON fallback for local dev.

### Storage

`localStorage` keys are prefixed with `lacos.`: `lacos.dock.apps`, `lacos.desktop.theme`, `lacos.app.language`, `lacos.quiz.secret.unlocked`, `lacos.notes`.

### Secret / Easter egg

Answering every Quiz question right on the first try emits `secretUnlocked`; the desktop calls `DesktopService.unlockFounderSecret()`, which unlocks the `founder` theme, shows an alert and enables `boot --founder` in the terminal.
