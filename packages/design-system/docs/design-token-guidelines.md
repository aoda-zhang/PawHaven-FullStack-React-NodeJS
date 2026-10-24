# PawHaven Design Token Guidelines

## Goals

Design tokens are shared design decisions, not just named values. Keep primitive values, semantic intent, and optional component-specific decisions separate. This document defines the handoff contract between Figma and the codebase; it does not claim that the current Figma file is automatically synchronized.

## Token layers

### 1. Primitive tokens

Primitive tokens define the available palette and scales. Examples in code include `--color-orange-6`, `--spacing-4`, `--radius-md`, and `--font-size-lg`.

Use primitives when defining a semantic token or for structural layout where the design system explicitly permits it. Avoid choosing raw palette colours directly for application UI.

### 2. Semantic tokens

Semantic tokens express why a value is used. Prefer these for application styling:

| Intent | Code token | Figma variable path | Guidance |
| --- | --- | --- | --- |
| Main text | `--color-text` | `Semantic / Color / Text / Primary` | Main content and headings |
| Secondary text | `--color-text-secondary` | `Semantic / Color / Text / Secondary` | Supporting copy; check contrast |
| Page background | `--color-background` | `Semantic / Color / Surface / Page` | Standard page surface |
| Card surface | `--color-card` | `Semantic / Color / Surface / Card` | Cards and content panels |
| Default border | `--color-border` | `Semantic / Color / Border / Default` | Low-emphasis boundaries |
| Primary action | `--color-primary` | `Semantic / Color / Action / Primary` | Main action |
| Success status | `--color-success` | `Semantic / Color / Status / Success` | Successful outcome or state |
| Warning status | `--color-warning` | `Semantic / Color / Status / Warning` | Caution or attention |
| Error status | `--color-error` | `Semantic / Color / Status / Error` | Error or destructive feedback |
| Info status | `--color-info` | `Semantic / Color / Status / Info` | Informational feedback |

Figma paths above are the recommended naming convention to implement, not a claim that the existing Figma file already contains them. Keep one canonical semantic token per intent; do not add aliases unless they represent a real, separately used role or are part of a tracked migration. This project currently supports a Light theme only: do not add Dark-theme variants or complete token families pre-emptively. Add a status-specific foreground token only when an actual component needs readable text/icons on a light status background and the existing status token does not provide sufficient contrast. For normal-sized text, target WCAG 2.2 AA contrast of at least 4.5:1; choose foregrounds for the actual background rather than automatically reusing the brand accent.

### 3. Component tokens

Create component-specific tokens only when a component needs a stable decision that is not adequately expressed by shared semantics. Existing examples include `--radius-button`, `--radius-button-large`, `--radius-card`, `--radius-card-large`, `--radius-input-large`, `--radius-panel`, `--radius-icon`, `--radius-media`, `--radius-skeleton`, `--radius-section`, `--radius-hero`, `--shadow-card`, and `--shadow-modal`.

Do not create a component token merely to duplicate a semantic token without a distinct component contract.

## Figma setup and selection

Create Figma Variable Collections for:

- **Primitives**: palette, spacing, radius, typography scales.
- **Semantic**: text, surface, border, action, and status.
- **Component**: only component-specific overrides that have a real use case.

Keep the semantic collection limited to roles used by the current Light UI. Do not create parallel light/dark collections until a Dark theme is an actual requirement.

When styling a design element, select a semantic variable by its purpose. For example, a rescue card uses `Semantic / Color / Surface / Card`; its title uses `Semantic / Color / Text / Primary`; its secondary description uses `Semantic / Color / Text / Secondary`. Do not choose a primitive such as `orange-6` directly for a button if the semantic action token is available.

Add a Token Catalog page to the Figma file. Each entry should show the variable path, a live sample, purpose, intended use, and important contrast/state notes. Keep examples connected to actual Variables instead of manually drawing colour swatches that can drift.

## Typography roles

Use the semantic utilities in code for recurring roles:

| Role | Code utility | Intended use |
| --- | --- | --- |
| Page title | `type-page-title` | Main page heading |
| Section title | `type-section-title` | Section heading |
| Body | `type-body` | Default paragraph |
| Secondary body | `type-body-secondary` | Supporting paragraph |
| Label | `type-label` | Form labels and compact labels |
| Caption | `type-caption` | Metadata and fine print |

In Figma, create matching Text Styles with the same role names and documented family, size, weight, line-height, and letter-spacing. Confirm font availability and language fallbacks before treating the Figma and PDF rendering as identical.

## Spacing and migration safety

The current spacing scale includes custom values that differ from Tailwind's defaults. These values may affect many utilities such as `p-5`, `gap-6`, and `mt-10`. Do not normalize or renumber the scale as an isolated token cleanup. First audit actual usage, document the intended scale, and migrate layouts with visual regression checks.

Use semantic aliases such as `--spacing-gutter`, `--spacing-section`, `--spacing-card`, and `--spacing-input` when expressing repeated design decisions.

## Cross-platform contract

The document-service prebuild copies the shared primitive tokens and semantic theme into its PDF runtime before compiling the PDF stylesheet. Keep PDF source styles token-based. PDF-specific typography, paper layout, and font fallback may differ from web styles when rendering requirements justify it, but colour choices should use shared semantic tokens unless the report specification explicitly requires a separate token.

The token-check gate covers shared design-system and frontend CSS plus the PDF engine entry stylesheet. ESLint validates token classes in application source. These static guards are not substitutes for generated-PDF visual checks or accessibility contrast testing.

## Change checklist

Before changing a token:

1. Identify its semantic purpose and consumers.
2. Check whether it affects a Tailwind utility used throughout the application.
3. Update Figma Variables and the Token Catalog through the team's chosen sync process.
4. Update the CSS token source. Keep one canonical name per intent; any temporary compatibility alias must have a tracked migration and removal point.
5. Run `pnpm token-check`, relevant package checks, and the document-service build.
6. Inspect representative web screens and generated PDFs for visual regressions.
7. Record any intentional contrast, font, or print-specific differences.
