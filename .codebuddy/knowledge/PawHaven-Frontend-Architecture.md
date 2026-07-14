# PawHaven — Frontend Architecture

> **Version**: v3.0 | **Date**: 2026-07-10
> **Related**: [System Overview](./PawHaven-System-Architecture-Overview.md) | [Backend](./PawHaven-Backend-Architecture.md)

---

## Table of Contents

1. [Architecture Philosophy](#1-architecture-philosophy)
2. [Feature-Based Module Architecture](#2-feature-based-module-architecture)
3. [Package Ecosystem](#3-package-ecosystem)
4. [Component Architecture & Boundaries](#4-component-architecture--boundaries)
5. [Routing Architecture](#5-routing-architecture)
6. [State Management Architecture](#6-state-management-architecture)
7. [Design Token Architecture](#7-design-token-architecture)
8. [Internationalization Architecture](#8-internationalization-architecture)
9. [Module Boundary Enforcement](#9-module-boundary-enforcement)

---

## 1. Architecture Philosophy

> **"Each feature is a self-contained module that aligns 1:1 to a business domain. Features do not know about each other."**

### Core Principles

| #   | Principle                              | What It Means                                                                                        |
| --- | -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| P1  | **Feature-based, not layer-based**     | All code for a business capability (components, API calls, hooks, types) co-locates in one folder.   |
| P2  | **Features are isolated**              | No cross-feature imports. Features communicate through the routing layer only.                       |
| P3  | **Packages are the shared foundation** | Reusable code graduates into versioned packages. Packages have strict dependency direction.          |
| P4  | **App layer orchestrates, not owns**   | The app shell provides providers, routing, and layout. Business logic belongs in features.           |
| P5  | **One schema, two contexts**           | Zod schemas in `@pawhaven/shared` validate frontend forms AND backend DTOs — single source of truth. |
| P6  | **CSS token layers enable rebranding** | Design tokens flow primitives → semantics → utilities. Change one file to rebrand.                   |

### The Graduation Rule

> **A component starts in a feature. When a second feature needs it, it graduates to a shared layer.**
>
> - Pure UI component (no business logic) → `@pawhaven/ui`
> - Business-common component (auth guards, error boundaries, domain widgets) → `@pawhaven/frontend-core`
> - Cross-cutting logic & infrastructure → `@pawhaven/frontend-core`

There is NO `apps/*/src/components/` layer — if a component is shared, it belongs in a package.

---

## 2. Feature-Based Module Architecture

### 2.1 Why Feature-Based

Layer-based organization (`components/`, `hooks/`, `services/` at the top level) scatters related code across the project. When you work on "Rescue Cases", you touch 5+ directories. When you delete the feature, you hunt through the entire codebase.

Feature-based organization flips this:

| Layer-Based (BAD)                            | Feature-Based (GOOD)                      |
| -------------------------------------------- | ----------------------------------------- |
| Related code scattered across 5+ directories | All Rescue code in `features/Rescue/`     |
| Unclear ownership                            | One folder = one team's domain            |
| Easy to accidentally couple features         | Lint-enforced isolation                   |
| Deleting a feature = find-and-hope           | Deleting a feature = `rm -rf features/X/` |

### 2.2 Feature Structure

```
features/
├── Landing/          # App bootstrap — runs first, fetches menus + routes
│   ├── index.tsx
│   ├── apis/
│   ├── components/
│   └── types.ts
│
├── Auth/             # Authentication — login, register, password reset
├── Home/             # Landing page — curated content, cross-domain aggregation
├── Rescue/           # Rescue cases — case lifecycle, tracking, timeline
├── Report/           # Stray reporting — submit reports, photos, GPS tagging
├── Adoption/         # Adoption — listings, applications, matching
├── Content/          # Stories & knowledge base
├── Volunteer/        # Volunteer profiles, case claiming, availability
├── Profile/          # User profile — aggregated view across domains
└── Discovery/        # Browse & search across all content
```

Each feature contains:

```
FeatureName/
├── index.tsx          # Public entry — only this is importable by the router
├── apis/              # React Query hooks + request functions
│   ├── queries.ts
│   └── mutations.ts
├── components/        # Feature-private components
├── hooks/             # Feature-private hooks
└── types.ts           # Feature-specific types
```

### 2.3 Feature Isolation Rules

```
✅ ALLOWED:
  Feature → @pawhaven/ui, @pawhaven/design-system, @pawhaven/frontend-core, @pawhaven/i18n
  Feature → @pawhaven/shared (types, schemas, constants)

❌ FORBIDDEN:
  Feature A → Feature B (any import)
  Feature → Another feature's apis/, components/, hooks/, types.ts

Enforcement: ESLint import/no-restricted-paths
  "features/*" → cannot import from "features/*" (except self)
```

### 2.4 How Features Align with Business Domains

| Feature       | Business Domain          | Owns                                     |
| ------------- | ------------------------ | ---------------------------------------- |
| **Landing**   | App initialization       | Bootstrap flow, menu/route config fetch  |
| **Auth**      | Identity & access        | Login, register, token management        |
| **Home**      | Cross-domain aggregation | Curation, featured content               |
| **Rescue**    | Rescue operations        | Case lifecycle, status machine, timeline |
| **Report**    | Stray animal reporting   | Report form, photo upload, GPS           |
| **Adoption**  | Pet adoption             | Listings, applications, agreements       |
| **Content**   | Stories & education      | Articles, rescue stories, knowledge base |
| **Volunteer** | Volunteer coordination   | Profiles, availability, case claims      |
| **Profile**   | User aggregation         | Cross-domain user activity view          |
| **Discovery** | Browse & search          | Unified search across content types      |

---

## 3. Package Ecosystem

### 3.1 Dependency Graph

```
                    ┌──────────────────┐
                    │  @pawhaven/shared │  Zero runtime deps
                    │  Types, schemas,  │
                    │  constants, events│
                    └────────┬─────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌──────────────┐ ┌──────────────┐
│ @pawhaven/       │ │ @pawhaven/   │ │ @pawhaven/   │
│ frontend-core    │ │ i18n         │ │ design-system │
│                  │ │              │ │              │
│ Infra, hooks,    │ │ i18next +    │ │ CSS tokens,   │
│ business-common  │ │ locale files │ │ theme, utils   │
│ components       │ │              │ │              │
└───┬───┬─────────┘ └──────────────┘ └──────────────┘
    │   │
    │   └──────────────────────┐
    ▼                          ▼
┌──────────────┐
│ @pawhaven/ui │
│ Form*, Toast  │
│ Loading, etc. │
└──────────────┘

apps/frontend/portal  ──depends on──►  ALL packages above
apps/frontend/admin   ──depends on──►  ALL packages above
```

### 3.2 Package Purpose & Boundaries

| Package                   | Why It Exists                                                                                                        | Contains                                                                                                                                          | Must NOT Contain                                        |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `@pawhaven/shared`        | Single source of truth for validation + types. One Zod schema = frontend form + backend DTO.                         | Zod schemas, TS types, enums, constants, event type definitions.                                                                                  | React, NestJS, Prisma, Node APIs. Must work in browser. |
| `@pawhaven/design-system` | Design tokens decoupled from components. Rebrand by changing one CSS file.                                           | CSS custom properties (tokens), theme.css, utilities.css, MUI theme.                                                                              | React components, JS runtime. CSS-only.                 |
| `@pawhaven/i18n`          | Centralized i18n for all apps. One locale file per language, shared across portal + admin.                           | i18next instance, I18nProvider React component, locale JSON files.                                                                                | Business logic, feature-specific translations.          |
| `@pawhaven/frontend-core` | Shared infrastructure + business-common components. API client, auth, query config, shared guards, error boundaries. | Axios instance (auth + encrypt interceptors), queryClient config, storageTool, lazyImport, shared React hooks, RequireAuth, ErrorBoundary, Brand. | Feature-specific business logic.                        |
| `@pawhaven/ui`            | Pure UI components — no API calls, no auth, no business logic. Form controls, loading states, notifications.         | FormInput, FormSelect, FormTextArea, FormDateRanger, Loading, Toast, NotificationBanner, SuspenseWrapper.                                         | API calls, auth checks, business logic, domain types.   |

### 3.3 Package Dependency Rules

```
@pawhaven/shared          → Nothing (zero dependencies)
@pawhaven/design-system   → Nothing (CSS-only)
@pawhaven/i18n            → @pawhaven/shared
@pawhaven/frontend-core   → @pawhaven/shared, @pawhaven/ui, @pawhaven/i18n
@pawhaven/ui              → @pawhaven/design-system, @pawhaven/i18n
Apps (portal, admin)      → ALL packages

❌ FORBIDDEN:
  @pawhaven/ui            → @pawhaven/frontend-core (pure UI must not depend on API layer)
  @pawhaven/design-system → @pawhaven/ui (tokens before components)
  Any package             → Any app
```

---

## 4. Component Architecture & Boundaries

### 4.1 Component Layer Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│  App Shell (apps/*/src/)                                 │
│  ├── Providers (I18n → Store → Query → Router)           │
│  ├── Layout (Header, Sidebar, Footer, Outlet)            │
│  └── Router (React Router config + component registry)   │
├─────────────────────────────────────────────────────────┤
│  Features (features/*/)                                  │
│  ├── Business-specific components, hooks, API calls      │
│  ├── May import: @pawhaven/ui, @pawhaven/design-system   │
│  ├── May NOT import: other features                      │
├─────────────────────────────────────────────────────────┤
│  Shared Packages (packages/*/)                           │
│  ├── @pawhaven/ui — Pure UI components                   │
│  ├── @pawhaven/frontend-core — Infra + business-common   │
│  ├── @pawhaven/i18n — Internationalization               │
│  ├── @pawhaven/design-system — Design tokens             │
│  └── @pawhaven/shared — Types & validation               │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Import Rules at Each Layer

| Layer                       | Can Import From                                                                                            | Cannot Import From                        |
| --------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| **Feature**                 | `@pawhaven/ui`, `@pawhaven/frontend-core`, `@pawhaven/i18n`, `@pawhaven/design-system`, `@pawhaven/shared` | Other features, Other apps                |
| **@pawhaven/ui**            | `@pawhaven/design-system`, `@pawhaven/i18n`                                                                | `@pawhaven/frontend-core`, Features, Apps |
| **@pawhaven/frontend-core** | `@pawhaven/shared`, `@pawhaven/ui`, `@pawhaven/i18n`                                                       | Features, Apps                            |

### 4.3 Component Graduation Flow

```
Feature A needs Component X
  │
  ├── Only Feature A uses it
  │     → lives in features/A/components/
  │
  └── Feature B also needs it
        │
        ├── Pure UI (Form control, Loading, Toast, Badge...)
        │     → graduate to @pawhaven/ui
        │
        └── Business-common (RequireAuth, ErrorBoundary, Brand, domain widgets...)
              → graduate to @pawhaven/frontend-core
```

---

## 5. Routing Architecture

### 5.1 Server-Driven Routing

```
App Start
  │
  ▼
Landing Feature (bootstraps first)
  │
  ├── Fetches bootstrap API → { menus, routes }
  │     Backend defines what pages exist and their layout configuration
  │
  ▼
AppRouterProvider
  │
  ├── Reads route config
  ├── Maps route keys → React components via routerElementMapping
  ├── Generates React Router route tree dynamically
  │
  ▼
Page Renders
```

### 5.2 Why Server-Driven Routing

| Without Server-Driven                 | With Server-Driven                                        |
| ------------------------------------- | --------------------------------------------------------- |
| Routes hardcoded in frontend          | Backend decides which pages/features are available        |
| Feature toggle = frontend deploy      | Feature toggle = backend config change                    |
| All users get same routes             | Role-based menus + routes per user                        |
| Adding a page = frontend + backend PR | Adding a page = backend config + component registry entry |

### 5.3 Component Registry

```
routerElementMapping.tsx — static map of page keys → React components

  Eager-loaded (always included):
    · Landing (bootstrap)
    · Auth (login/register)
    · Home (landing page)

  Lazy-loaded (code-split, loaded on first visit):
    · Rescue, Report, Adoption, Content, Volunteer, Profile, Discovery
```

### 5.4 Routing Rules

```
✅ Route paths are defined in the backend bootstrap API — not hardcoded
✅ Route-to-component mapping is the ONLY legal cross-feature reference
✅ All routes go through AppRouterProvider — no manual <Route> in features
✅ Lazy-loaded features use React.lazy + SuspenseWrapper from @pawhaven/ui

❌ Features do NOT import from other features' index.tsx
❌ Features do NOT reference other features' route paths
```

---

## 6. State Management Architecture

### 6.1 State Categories

| State Type       | Scope           | Tool                       | Why                                                                        |
| ---------------- | --------------- | -------------------------- | -------------------------------------------------------------------------- |
| **Server state** | Global, cached  | TanStack Query v5          | API data with automatic cache invalidation, background refetch, pagination |
| **Client state** | Global          | Redux Toolkit              | Auth tokens, locale preference, UI preferences — must survive page reloads |
| **Form state**   | Local           | React Hook Form + Zod      | Form validation shares schemas with backend via @pawhaven/shared           |
| **URL state**    | Global, encoded | React Router search params | Filters, pagination, sort order — shareable via URL                        |

### 6.2 Why This Split

```
Server state (TanStack Query):
  - "What's the list of rescue cases?" → Query
  - Cache it, refetch when stale, invalidate on mutation
  - We do NOT put this in Redux — Query is purpose-built for async server state

Client state (Redux Toolkit):
  - "Is the user logged in? What's their locale?"
  - These are synchronous, long-lived, and needed by many components
  - Persisted to encrypted localStorage

Form state (React Hook Form):
  - "What did the user type in this field?"
  - Ephemeral, too frequent to put in Redux, should not pollute Query cache

URL state (React Router):
  - "Which page / what filters is the user looking at?"
  - Should survive browser refresh and be shareable
```

### 6.3 Store Structure

```
Redux Store:
  global:
    ├── auth        (user, tokens, permissions)
    ├── locale      (current language, fallback chain)
    └── ui          (sidebar collapsed, theme mode)

  Per-feature slices (dynamic registration):
    ├── rescue      (selected case, filter state)
    ├── volunteer   (current availability, selected region)
    └── ...

TanStack Query:
  Query keys per feature:
    ['rescue', 'cases', filters]
    ['report', 'list', pagination]
    ['adoption', 'listing', id]
```

### 6.4 Persistence Strategy

```
Redux Persist:
  Auth tokens    → encrypted localStorage
  Locale         → localStorage
  UI preferences → localStorage

TanStack Query Persister:
  Query cache    → localStorage (hydration on app start)
  gcTime: 30min  (keep in memory after inactive)
  staleTime: 5min (before refetch)
```

---

## 7. Design Token Architecture

### 7.1 Three-Layer Token System

```
Layer 1: Primitives     (tokens/*.css)
  Raw design values — independent of meaning
  Example: --color-orange-6: #f7823a

          ▼

Layer 2: Semantics      (theme.css)
  Map primitives to meaning — "what role, not what color"
  Example: --color-primary: var(--color-orange-6)

          ▼

Layer 3: Utilities      (utilities.css)
  Pre-built component patterns from semantic tokens
  Example: .btn-primary { background: var(--color-primary); }
```

### 7.2 Why Three Layers

```
Without layers:
  Components use --color-orange-6 directly
  → To rebrand, you search-and-replace 200 files
  → You miss one, the UI breaks

With 3 layers:
  Components use .btn-primary (Layer 3) or --color-primary (Layer 2)
  → To rebrand, change ONE mapping in theme.css
  → All components update automatically
```

### 7.3 Token File Structure

```
packages/design-system/
├── tokens/               # Layer 1: Primitives
│   ├── colors.css        # --color-orange-1 through --color-orange-12
│   ├── spacing.css       # --space-1 through --space-12
│   ├── typography.css    # --font-size-*, --font-weight-*, --line-height-*
│   ├── radii.css         # --radius-1 through --radius-6
│   ├── shadows.css       # --shadow-1 through --shadow-6
│   └── ...
│
├── theme.css             # Layer 2: Semantics
│   Maps primitives → semantic roles:
│   --color-primary: var(--color-orange-6)
│   --color-danger: var(--color-red-8)
│   --spacing-section: var(--space-8)
│   ...
│
├── utilities.css         # Layer 3: Component patterns
│   .btn-primary, .card, .input, .badge, ...
│
└── mui-theme.ts          # Bridge: maps tokens to MUI theme object
    For components that still use MUI (DatePicker)
```

### 7.4 How Code Consumes Tokens

```
❌ BAD:    <div className="bg-[#f7823a]">         Hardcoded value
❌ BAD:    <div style={{color: '#f7823a'}}>       No token, no rebrand

✅ GOOD:   <div className="bg-primary">           Semantic utility
✅ GOOD:   <Button className="btn-primary">        Component utility
✅ GOOD:   <MuiDatePicker sx={{ color: tokens.colorPrimary }}>  TS token (MUI only)
```

---

## 8. Internationalization Architecture

### 8.1 Design

```
@pawhaven/i18n
  │
  ├── i18next instance (shared by all frontend apps)
  ├── I18nProvider (React context wrapper)
  │
  └── locales/
      ├── zh-CN/     (Primary — product targets Chinese market)
      │   ├── common.json
      │   ├── auth.json
      │   └── ...
      ├── en-US/     (Secondary)
      └── de-DE/     (Secondary)
```

### 8.2 Why a Separate Package

```
If i18n lives in each app:
  - Duplicate i18next config across portal + admin
  - Duplicate common translations (buttons, errors, dates)
  - Locale switching inconsistent

@pawhaven/i18n as a package:
  - One i18next instance, shared by portal + admin
  - Common translations in one place
  - Apps add app-specific locale files to their own src/
  - Adding a language = add one folder + register locale
```

### 8.3 Translation File Convention

```
@pawhaven/i18n/locales/{lang}/common.json  → Shared across all apps
  "button.submit", "error.required", "date.format", ...

app-specific locale files live in the app:
  apps/frontend/portal/src/locales/{lang}/rescue.json
  apps/frontend/portal/src/locales/{lang}/report.json
```

---

## 9. Module Boundary Enforcement

### 9.1 ESLint Rules

```javascript
// .eslintrc.cjs — custom rules for frontend

{
  rules: {
    // No cross-feature imports
    'import/no-restricted-paths': ['error', {
      zones: [
        {
          target: './src/features',
          from: './src/features',
          except: ['./index.tsx'], // Only router imports feature entry
        },
      ],
    }],

    // @pawhaven/ui must not import from frontend-core
    'import/no-restricted-paths': ['error', {
      zones: [
        {
          target: './packages/ui/src',
          from: './packages/frontend-core/src',
        },
      ],
    }],
  },
}
```

### 9.2 CI Architecture Fitness Function

```bash
#!/bin/bash
# scripts/check-frontend-boundaries.sh

# 1. No cross-feature imports
CROSS_FEATURE=$(grep -r "from.*features/" apps/frontend/portal/src/features/ \
  --include="*.ts" --include="*.tsx" \
  | grep -v "features/[^/]*/.*from.*features/[^/]*" 2>/dev/null || true)

# 2. @pawhaven/ui has no React Query / axios imports
UI_API_LEAK=$(grep -r "@tanstack/react-query\|axios" packages/ui/src/ \
  --include="*.ts" --include="*.tsx" 2>/dev/null || true)

# 3. No hardcoded color values in components
HARDCODED_COLORS=$(grep -rP "#[0-9a-fA-F]{3,8}" apps/frontend/portal/src/features \
  --include="*.tsx" 2>/dev/null || true)

if [ -n "$CROSS_FEATURE" ]; then
  echo "❌ Cross-feature import detected"
  exit 1
fi
if [ -n "$UI_API_LEAK" ]; then
  echo "❌ @pawhaven/ui imports API/db code"
  exit 1
fi
if [ -n "$HARDCODED_COLORS" ]; then
  echo "⚠️  Hardcoded color values detected — use design tokens"
fi
echo "✅ Frontend boundaries clean"
```

---

## 10. Tech Stack

### 10.1 Core

| Category                  | Technology | Version / Notes    |
| ------------------------- | ---------- | ------------------ |
| **Framework**             | React      | v19                |
| **Language**              | TypeScript | Strict mode        |
| **Build Tool**            | Vite       |                    |
| **Package Manager**       | pnpm       | Workspace monorepo |
| **Monorepo Orchestrator** | Turbo      |                    |

### 10.2 State Management

| Category         | Technology            | Scope                                   |
| ---------------- | --------------------- | --------------------------------------- |
| **Server State** | TanStack Query        | v5 — API caching, refetch, invalidation |
| **Client State** | Redux Toolkit         | Auth, locale, UI preferences            |
| **Form State**   | React Hook Form + Zod | Form validation shared with backend     |
| **URL State**    | React Router          | Search params, filters, pagination      |

### 10.3 UI & Styling

| Category              | Technology            | Notes                          |
| --------------------- | --------------------- | ------------------------------ |
| **CSS Framework**     | Tailwind CSS          | Utility-first                  |
| **Component Library** | MUI (Material UI)     | DatePicker and complex widgets |
| **Design Tokens**     | CSS Custom Properties | 3-layer token system           |
| **Icons**             | Lucide                |                                |

### 10.4 Routing & i18n

| Category                 | Technology              | Notes                             |
| ------------------------ | ----------------------- | --------------------------------- |
| **Routing**              | React Router            | Server-driven routing             |
| **Internationalization** | i18next + react-i18next | Shared via @pawhaven/i18n package |

### 10.5 Validation & API

| Category        | Technology | Notes                       |
| --------------- | ---------- | --------------------------- |
| **Validation**  | Zod        | Schemas in @pawhaven/shared |
| **HTTP Client** | Axios      | Auth + encrypt interceptors |

### 10.6 Code Quality

| Category            | Technology                        | Notes                   |
| ------------------- | --------------------------------- | ----------------------- |
| **Linting**         | ESLint                            | Feature isolation rules |
| **Formatting**      | Prettier                          | Centralized config      |
| **Git Hooks**       | Husky + lint-staged               | Pre-commit checks       |
| **Commit Standard** | Commitlint (Conventional Commits) |                         |

---

> **Related Docs**: [Backend Architecture](./PawHaven-Backend-Architecture.md) | [System Overview](./PawHaven-System-Architecture-Overview.md)
