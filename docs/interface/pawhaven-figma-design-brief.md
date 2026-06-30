# PawHaven — Figma UI Design Brief

> **Version**: v1.0 | **Date**: 2025-07-01
> **Based on**: [PawHaven-Product-Strategy.md](../PawHaven-Product-Strategy.md) · [PawHaven-System-Architecture.md](../PawHaven-System-Architecture.md) · `@pawhaven/design-system`
> **Purpose**: Single-source-of-truth design specification for creating the PawHaven Figma file.

---

## 目录

1. [Design Philosophy & Aesthetic Direction](#1-design-philosophy--aesthetic-direction)
2. [Design Tokens Application Map](#2-design-tokens-application-map)
3. [Typography System](#3-typography-system)
4. [Color System](#4-color-system)
5. [Spacing & Layout Grid](#5-spacing--layout-grid)
6. [Component Library](#6-component-library)
7. [Screen Specifications](#7-screen-specifications)
8. [Responsive Breakpoints](#8-responsive-breakpoints)
9. [Interaction & Motion](#9-interaction--motion)
10. [Figma File Structure](#10-figma-file-structure)

---

## 1. Design Philosophy & Aesthetic Direction

### 1.1 Brand Personality

| Dimension            | Value                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Tone**             | Warm compassion meets professional trust — like a well-run animal shelter: clean, organized, but undeniably caring |
| **Design Direction** | **Warm Editorial** — magazine-layout sensibility with organic warmth. Think "Kinfolk meets rescue mission."        |
| **Differentiation**  | Not a generic pet app. The design tells the story of _transformation_ — from stray to safe, from lost to loved.    |
| **Key Emotion**      | Hopeful. Every screen should whisper: "This animal's story isn't over yet — and you can be part of it."            |

### 1.2 Core Design Principles

| #   | Principle                           | Execution                                                                                         |
| --- | ----------------------------------- | ------------------------------------------------------------------------------------------------- |
| P1  | **Warmth through tactility**        | Brown-warm neutral backgrounds, rounded corners, soft shadows — the opposite of cold corporate UI |
| P2  | **Clarity in urgency**              | Rescue statuses must be instantly scannable; color + icon + text redundancy                       |
| P3  | **Mobile-first, never mobile-only** | Core flows designed for phone (reporter in the field), expand elegantly to desktop                |
| P4  | **Every number tells a story**      | Statistics are never just numbers — always contextualized ("32 animals waiting" not "32 records") |
| P5  | **Transparency as trust**           | Timelines, status histories, public rescue records — design makes the invisible visible           |

### 1.3 Visual Language Keywords

```
WARMTH    ·    HOPE    ·    CLARITY    ·    COMMUNITY    ·    TRANSFORMATION
```

### 1.4 Anti-Patterns (What We Avoid)

- ❌ Cold medical/hospital aesthetics (too sterile for an emotional product)
- ❌ Overly playful/cartoonish (undermines the seriousness of rescue work)
- ❌ Dark mode as default (this is about hope, not darkness)
- ❌ Generic pet-shop vibes (we're a rescue platform, not a store)
- ❌ Data-dense dashboards (this is a storytelling platform, not an analytics tool)

---

## 2. Design Tokens Application Map

All tokens live in `@pawhaven/design-system`. This section maps them to Figma styles.

### 2.1 Figma Style Setup

Create these **Figma Styles** (Color, Text, Effect) that mirror the CSS tokens:

#### Color Styles (create in Figma)

| Figma Style Name          | CSS Token                                | Hex Value | Usage                                 |
| ------------------------- | ---------------------------------------- | --------- | ------------------------------------- |
| `primary/default`         | `--color-primary`                        | `#F7823A` | Primary buttons, links, brand accents |
| `primary/hover`           | `--color-primary-hover`                  | `#F66B26` | Button hover state                    |
| `primary/active`          | `--color-primary-active`                 | `#E65A1A` | Button pressed state                  |
| `primary/light`           | `--color-primary-light`                  | `#FFF7ED` | Highlight backgrounds                 |
| `secondary/default`       | `--color-secondary`                      | `#4CAF50` | Secondary CTAs, success               |
| `surface/default`         | `--color-surface`                        | `#FFFFFF` | Cards, modals, elevated surfaces      |
| `surface/hover`           | `--color-surface-hover`                  | `#FFF5EC` | Card hover state                      |
| `background/default`      | `--color-background`                     | `#ECDCCF` | Page background                       |
| `background/subtle`       | `--color-background-subtle`              | `#F6E9DF` | Section backgrounds                   |
| `text/primary`            | `--color-text`                           | `#2F2F2F` | Body text, headings                   |
| `text/secondary`          | `--color-text-secondary`                 | `#737373` | Supporting text                       |
| `text/tertiary`           | `--color-text-tertiary`                  | `#A3A3A3` | Captions, metadata                    |
| `text/placeholder`        | `--color-text-placeholder`               | `#D4D4D4` | Input placeholders                    |
| `text/inverse`            | `--color-text-inverse`                   | `#FFFFFF` | Text on dark backgrounds              |
| `border/default`          | `--color-border`                         | `#D4D4D4` | Default borders                       |
| `border/focus`            | `--color-border-focus`                   | `#F7823A` | Focus ring                            |
| `status/error`            | `--color-error`                          | `#EF4444` | Error states                          |
| `status/success`          | `--color-success`                        | `#4CAF50` | Success confirmation                  |
| `status/warning`          | `--color-warning`                        | `#F59E0B` | Warnings, pending                     |
| `status/info`             | `--color-info`                           | `#3B82F6` | Information, in-progress              |
| `rescue/pending`          | `--color-rescue-status-pending`          | `#F59E0B` | Rescue: 待响应                        |
| `rescue/inProgress`       | `--color-rescue-status-inProgress`       | `#3B82F6` | Rescue: 救助中                        |
| `rescue/treated`          | `--color-rescue-status-treated`          | `#1E3A8A` | Rescue: 已治疗                        |
| `rescue/recovering`       | `--color-rescue-status-recovering`       | `#4CAF50` | Rescue: 康复中                        |
| `rescue/awaitingAdoption` | `--color-rescue-status-awaitingAdoption` | `#FBBF24` | Rescue: 待领养                        |
| `rescue/adopted`          | `--color-rescue-status-adopted`          | `#15803D` | Rescue: 已领养                        |
| `rescue/failed`           | `--color-rescue-status-failed`           | `#A3A3A3` | Rescue: 已结束                        |

#### Effect Styles (create in Figma)

| Figma Style Name  | CSS Token           | Value                            |
| ----------------- | ------------------- | -------------------------------- |
| `shadow/card`     | `--shadow-card`     | `0px 1px 3px rgba(0,0,0,0.12)`   |
| `shadow/dropdown` | `--shadow-dropdown` | `0px 3px 6px rgba(0,0,0,0.16)`   |
| `shadow/modal`    | `--shadow-modal`    | `0px 8px 20px rgba(0,0,0,0.18)`  |
| `shadow/toast`    | `--shadow-toast`    | `0px 12px 28px rgba(0,0,0,0.22)` |

#### Text Styles (create in Figma)

See Section 3 below.

---

## 3. Typography System

### 3.1 Font Stack

```
Display / Headings: 'Poppins', 'Nunito', system-ui, sans-serif
Body / UI:          'Inter', 'Nunito', system-ui, sans-serif
Serif (stories):    'Merriweather', serif, system-ui
Handwriting:        'Patrick Hand', cursive  (for story quotes, personal touches)
```

### 3.2 Figma Text Styles

| Style Name        | Font         | Size            | Weight | Line Height | Letter Spacing | Usage                        |
| ----------------- | ------------ | --------------- | ------ | ----------- | -------------- | ---------------------------- |
| `display/hero`    | Poppins      | 60px (3.75rem)  | 800    | 1.1         | -0.025em       | Homepage hero headline       |
| `display/large`   | Poppins      | 48px (3rem)     | 700    | 1.15        | -0.025em       | Page titles                  |
| `heading/h1`      | Poppins      | 36px (2.25rem)  | 700    | 1.25        | -0.025em       | Section headings             |
| `heading/h2`      | Poppins      | 30px (1.875rem) | 600    | 1.3         | -0.0125em      | Card titles                  |
| `heading/h3`      | Poppins      | 24px (1.5rem)   | 600    | 1.35        | 0              | Sub-section headings         |
| `heading/h4`      | Inter        | 20px (1.25rem)  | 600    | 1.375       | 0              | Minor headings               |
| `body/large`      | Inter        | 18px (1.125rem) | 400    | 1.625       | 0              | Lead paragraphs, story intro |
| `body/default`    | Inter        | 16px (1rem)     | 400    | 1.5         | 0              | Body text                    |
| `body/small`      | Inter        | 14px (0.875rem) | 400    | 1.5         | 0              | Supporting text, metadata    |
| `body/caption`    | Inter        | 12px (0.75rem)  | 400    | 1.5         | 0.0125em       | Captions, timestamps         |
| `label/button-lg` | Inter        | 16px (1rem)     | 600    | 1           | 0.0125em       | Large buttons                |
| `label/button-md` | Inter        | 14px (0.875rem) | 600    | 1           | 0.0125em       | Medium buttons               |
| `label/button-sm` | Inter        | 12px (0.75rem)  | 600    | 1           | 0.025em        | Small buttons, badges        |
| `label/tag`       | Inter        | 12px (0.75rem)  | 500    | 1           | 0.0125em       | Status tags, chips           |
| `story/quote`     | Patrick Hand | 24px (1.5rem)   | 400    | 1.4         | 0              | Pull quotes in stories       |
| `story/body`      | Merriweather | 16px (1rem)     | 400    | 1.75        | 0              | Story article body           |

### 3.3 Typography Rules for Figma

1. **Vertical Rhythm**: All spacing is based on a 24px grid unit (16px body × 1.5 line-height = 24px baseline)
2. **Content Width**: Body text columns max at 65ch (~640px at 16px)
3. **Hierarchy Contrast**: Never use adjacent sizes (no 16px next to 18px). Jump at least 1.25×.

---

## 4. Color System

### 4.1 Palette Overview

```
Brand Orange (Warmth + Action)
#F7823A ─── Primary CTA, brand accent
#F66B26 ─── Hover state
#E65A1A ─── Active state
#FFF7ED ─── Subtle highlight background

Secondary Green (Growth + Success)
#4CAF50 ─── Secondary actions, adopted status
#15803D ─── Dark green for adopted badges

Background Browns (Warmth + Grounding)
#ECDCCF ─── Page background (warm, not white)
#F6E9DF ─── Section alternation
#FFF5EC ─── Card hover

Text Grays (Clarity + Hierarchy)
#2F2F2F ─── Primary text
#737373 ─── Secondary text
#A3A3A3 ─── Tertiary/captions
#FFFFFF ─── Inverse text

Rescue Status (Semantic Color Coding)
#F59E0B ─── Pending (yellow - needs attention)
#3B82F6 ─── In Progress (blue - active)
#1E3A8A ─── Treated (dark blue - medical)
#4CAF50 ─── Recovering (green - healing)
#FBBF24 ─── Awaiting Adoption (gold - ready)
#15803D ─── Adopted (dark green - complete)
#A3A3A3 ─── Failed (gray - ended)
```

### 4.2 Color Application Rules

| Context          | Background                                                        | Text                        | Accent                    |
| ---------------- | ----------------------------------------------------------------- | --------------------------- | ------------------------- |
| Page (default)   | `background/default` (#ECDCCF)                                    | `text/primary` (#2F2F2F)    | —                         |
| Card (elevated)  | `surface/default` (#FFFFFF)                                       | `text/primary` (#2F2F2F)    | Status badge color        |
| Primary CTA      | `primary/default` (#F7823A)                                       | `text/inverse` (#FFFFFF)    | —                         |
| Secondary CTA    | `primary/light` (#FFF7ED)                                         | `primary/default` (#F7823A) | —                         |
| Hero section     | `primary/default` (#F7823A) → `primary/active` (#E65A1A) gradient | `text/inverse` (#FFFFFF)    | White decorative elements |
| Story article    | `surface/default` (#FFFFFF)                                       | `text/primary` (#2F2F2F)    | Serif body, orange links  |
| Error feedback   | `status/error` (#EF4444) bg @10%                                  | `status/error` (#EF4444)    | Red border                |
| Success feedback | `status/success` (#4CAF50) bg @10%                                | `status/success` (#4CAF50)  | Green border              |

---

## 5. Spacing & Layout Grid

### 5.1 Spacing Scale (24px baseline)

| Token        | Value | Figma Value | Usage                                |
| ------------ | ----- | ----------- | ------------------------------------ |
| `spacing-1`  | 4px   | 4           | Micro spacing (icon gaps)            |
| `spacing-2`  | 8px   | 8           | Tight spacing (label ↔ field)        |
| `spacing-3`  | 12px  | 12          | Input padding                        |
| `spacing-4`  | 16px  | 16          | Standard gap                         |
| `spacing-5`  | 24px  | 24          | Card padding, section gap ← BASELINE |
| `spacing-6`  | 32px  | 32          | Large gap                            |
| `spacing-8`  | 48px  | 48          | Section separation                   |
| `spacing-10` | 64px  | 64          | Major section break                  |
| `spacing-12` | 80px  | 80          | Hero padding                         |

### 5.2 Layout Grid (Figma)

| Breakpoint | Width  | Columns | Gutter | Margin                    |
| ---------- | ------ | ------- | ------ | ------------------------- |
| Mobile     | 360px  | 4       | 16px   | 16px                      |
| Tablet     | 768px  | 8       | 24px   | 32px                      |
| Desktop    | 1280px | 12      | 24px   | 64px                      |
| Wide       | 1536px | 12      | 32px   | Auto (max 1280px content) |

### 5.3 Figma Grid Setup

In Figma, create these layout grids on frames:

**Desktop Frame (1280px)**

```
Type: Columns, Count: 12, Width: Auto, Gutter: 24px, Margin: 64px
Type: Rows, Count: Auto, Height: 24px, Gutter: 0 (for baseline rhythm alignment)
```

**Tablet Frame (768px)**

```
Type: Columns, Count: 8, Width: Auto, Gutter: 24px, Margin: 32px
```

**Mobile Frame (360px)**

```
Type: Columns, Count: 4, Width: Auto, Gutter: 16px, Margin: 16px
```

---

## 6. Component Library

Each component below includes its Figma variant structure, dimensions, states, and tokens used.

### 6.1 Button

**Figma Component**: `Button / [Variant] / [State]`

| Property     | Value                                                                                                                                               |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Variants** | `primary`, `secondary`, `outline`, `ghost`, `danger`                                                                                                |
| **Sizes**    | `lg` (h:48px, p:16px 24px, font:label/button-lg), `md` (h:40px, p:12px 20px, font:label/button-md), `sm` (h:32px, p:8px 16px, font:label/button-sm) |
| **States**   | `default`, `hover`, `active`, `focus`, `disabled`, `loading`                                                                                        |
| **Radius**   | `radius-button` = 8px                                                                                                                               |
| **Icons**    | Optional leading/trailing icon slot, 20px icon (lg), 18px (md), 16px (sm)                                                                           |

**Variant Styles:**

| Variant       | Background        | Text Color        | Border           |
| ------------- | ----------------- | ----------------- | ---------------- |
| Primary       | `primary/default` | `text/inverse`    | none             |
| Primary Hover | `primary/hover`   | `text/inverse`    | none             |
| Secondary     | `primary/light`   | `primary/default` | none             |
| Outline       | transparent       | `text/primary`    | `border/default` |
| Ghost         | transparent       | `text/secondary`  | none             |
| Danger        | `status/error`    | `text/inverse`    | none             |
| Disabled      | `text/muted` @30% | `text/tertiary`   | none             |

### 6.2 Input Field

**Figma Component**: `Input / [Type] / [State]`

| Property    | Value                                                                |
| ----------- | -------------------------------------------------------------------- |
| **Types**   | `text`, `textarea`, `select`, `search`, `file-upload`                |
| **States**  | `default`, `hover`, `focus`, `filled`, `error`, `disabled`           |
| **Height**  | 48px (text), auto for textarea (min 120px)                           |
| **Padding** | 12px 16px (spacing-3 horizontal, spacing-4 vertical)                 |
| **Radius**  | `radius-input` = 4px                                                 |
| **Border**  | `border/default` (1px), focus: `border/focus` (2px ring)             |
| **Label**   | Above input, `body/small` weight 500, 12px gap between label & field |

**Figma structure:**

```
Frame: Input Field
├── Label (Text: body/small, weight 500, color: text/primary)
├── Input Container (Frame, h:48px, border: 1px solid border/default, radius: 4px)
│   ├── Leading Icon (optional, 20px, color: text/tertiary)
│   ├── Placeholder Text (Text: body/default, color: text/placeholder)
│   └── Trailing Icon (optional, 20px, for clear/password)
├── Helper Text (Text: body/caption, color: text/tertiary)
└── Error Text (Text: body/caption, color: status/error — only in error state)
```

### 6.3 Rescue Card

**Figma Component**: `Card / Rescue`

This is the most critical component — it's the primary unit of information display.

| Property       | Value                                                              |
| -------------- | ------------------------------------------------------------------ |
| **Width**      | 100% (column), fixed (360px in grid)                               |
| **Padding**    | 24px (spacing-5)                                                   |
| **Radius**     | `radius-card` = 12px                                               |
| **Shadow**     | `shadow/card`                                                      |
| **Background** | `surface/default`                                                  |
| **Hover**      | background → `surface/hover`, shadow → `shadow/dropdown`, lift 2px |

**Figma structure:**

```
Frame: Rescue Card (w: 360px, radius: 12px, shadow: shadow/card)
├── Image Container (h: 200px, radius: 12px 12px 0 0 — or 8px all around for non-edge)
│   ├── Cover Photo (fill, object-fit: cover)
│   ├── Urgency Badge (top-right, 12px margin) — see Badge component
│   └── Status Badge (top-left, 12px margin)
├── Content Area (padding: 24px)
│   ├── Animal Name (heading/h3) + Animal ID (body/caption, text/tertiary)
│   ├── Metadata Row (gap: 16px)
│   │   ├── Location icon + text (body/small)
│   │   ├── Animal Type icon + text
│   │   └── Time ago (body/caption)
│   ├── Description (body/small, 2-line clamp, text/secondary)
│   └── Action Row (flex-between, mt: 16px)
│       ├── Progress indicator or action button
│       └── Share/Save icons (24px, text/tertiary → text/primary on hover)
```

### 6.4 Status Badge

**Figma Component**: `Badge / Status`

| Property     | Value                                                                                     |
| ------------ | ----------------------------------------------------------------------------------------- |
| **Variants** | `pending`, `inProgress`, `treated`, `recovering`, `awaitingAdoption`, `adopted`, `failed` |
| **Height**   | 28px                                                                                      |
| **Padding**  | 6px 12px horizontal                                                                       |
| **Radius**   | `radius-full` = 9999px                                                                    |
| **Font**     | `label/tag`                                                                               |
| **Icon**     | Optional leading dot/diamond 8px                                                          |

**Status Styles:**

| Status           | Background                     | Text Color          | Dot Color                 | Label (ZH/EN)        |
| ---------------- | ------------------------------ | ------------------- | ------------------------- | -------------------- |
| pending          | `rescue/pending` @10%          | `rescue/pending`    | `rescue/pending`          | 待响应 / Pending     |
| inProgress       | `rescue/inProgress` @10%       | `rescue/inProgress` | `rescue/inProgress`       | 救助中 / In Progress |
| treated          | `rescue/treated` @10%          | `rescue/treated`    | `rescue/treated`          | 已治疗 / Treated     |
| recovering       | `rescue/recovering` @10%       | `rescue/recovering` | `rescue/recovering`       | 康复中 / Recovering  |
| awaitingAdoption | `rescue/awaitingAdoption` @15% | `#B45309`           | `rescue/awaitingAdoption` | 待领养 / Awaiting    |
| adopted          | `rescue/adopted` @10%          | `rescue/adopted`    | `rescue/adopted`          | 已领养 / Adopted     |
| failed           | `rescue/failed` @10%           | `text/tertiary`     | `text/tertiary`           | 已结束 / Ended       |

### 6.5 Timeline

**Figma Component**: `Timeline / [Variant]`

| Property       | Value                                                       |
| -------------- | ----------------------------------------------------------- |
| **Variants**   | `desktop` (horizontal left), `mobile` (vertical full-width) |
| **Line Style** | 2px solid `border/default`, 24px gap between nodes          |

**Timeline Node (Figma structure):**

```
Frame: Timeline Node
├── Dot (w: 12px, h: 12px, radius: 50%, color: matches status)
├── Connector Line (w: 2px, color: border/default, from prev node to this node)
├── Content
│   ├── Status Badge
│   ├── Timestamp (body/caption, text/tertiary)
│   ├── Operator Info (body/small weight 500)
│   ├── Description Text (body/small, text/secondary)
│   └── Photos (optional, 2-4 thumbnails in row, 80px, radius: 8px)
```

### 6.6 Navigation

**Figma Component**: `Navigation / [Variant]`

#### Desktop Header

```
Frame: Header (w: 100%, h: 72px, bg: surface/default, shadow: shadow/card)
├── Logo (h: 40px, PawHaven wordmark)
├── Nav Links (gap: 32px)
│   ├── Link (label/button-md, text/secondary → text/primary + primary bottom border on active)
│   └── ...
├── Right Actions (gap: 16px)
│   ├── Notification Bell (icon: 24px, badge count)
│   ├── User Avatar (w: 40px, radius: full)
│   └── Language Switcher
```

#### Mobile Bottom Nav

```
Frame: Mobile Nav (w: 100%, h: 64px, bg: surface/default, shadow: shadow/modal top)
├── 5 tabs, equal width
│   ├── Icon (24px) + Label (body/caption, 3 lines)
│   └── Active state: icon + label → primary/default color
```

### 6.7 Card Grid Layout

**Figma Auto Layout Component**: `Card Grid / [Columns]`

```
Frame: Card Grid (Auto Layout: Horizontal wrap, gap: 24px)
├── 1 column:  mobile portrait  (cards full width)
├── 2 columns: mobile landscape / small tablet
├── 3 columns: tablet / small desktop
└── 4 columns: desktop
```

### 6.8 Stat Card

**Figma Component**: `Card / Stat`

| Property       | Value              |
| -------------- | ------------------ |
| **Width**      | Fill column        |
| **Padding**    | 24px               |
| **Radius**     | 12px               |
| **Background** | `surface/default`  |
| **Layout**     | Vertical, centered |

```
Frame: Stat Card
├── Icon (32px, primary/default @20% bg circle)
├── Number (heading/h2, text/primary)
├── Label (body/small, text/tertiary)
└── Trend indicator (optional, body/caption, green up / red down arrow)
```

### 6.9 Empty State

**Figma Component**: `Empty State`

| Property    | Value                               |
| ----------- | ----------------------------------- |
| **Width**   | Fill container, max 480px, centered |
| **Padding** | 48px vertical                       |

```
Frame: Empty State
├── Illustration (180px × 180px, warm line-art style)
├── Title (heading/h3, text/primary, mt: 24px)
├── Description (body/default, text/secondary, mt: 8px, text-align: center)
└── CTA Button (primary, mt: 24px)
```

### 6.10 Search Bar

**Figma Component**: `Search / [Variant]`

| Variant   | Width                    | Height | Icon Position            |
| --------- | ------------------------ | ------ | ------------------------ |
| `full`    | 100%                     | 48px   | Leading 24px search icon |
| `compact` | 320px (expands on focus) | 40px   | Leading 20px icon        |

```
Frame: Search Bar
├── Search Icon (24px, text/tertiary, ml: 16px)
├── Input (borderless, placeholder: "搜索救助案例、知识..." / "Search rescues, knowledge...")
└── Filter Button (trailing, icon-only, on search results page)
```

### 6.11 Step Indicator (Report Flow)

**Figma Component**: `Step Indicator`

```
Frame: Step Indicator (Horizontal, gap: 8px between steps)
├── Step 1-6
│   ├── Circle (w: 32px, h: 32px, radius: full)
│   │   ├── Completed: primary/default bg, white checkmark
│   │   ├── Active: primary/default border 2px, white bg, primary step number
│   │   └── Pending: border/default border, white bg, text/tertiary number
│   ├── Connector Line (h: 2px, 32px wide, border/default or primary/default)
│   └── Label (body/caption, below circle, 8px gap)
```

### 6.12 Modal / Dialog

**Figma Component**: `Modal`

| Property     | Value                    |
| ------------ | ------------------------ |
| **Width**    | Max 520px (mobile: 90vw) |
| **Radius**   | `radius-dialog` = 16px   |
| **Shadow**   | `shadow/modal`           |
| **Backdrop** | `#000000` @50%, blur 4px |

```
Frame: Modal Backdrop
└── Frame: Modal Container
    ├── Header (padding: 24px 24px 0)
    │   ├── Title (heading/h3)
    │   └── Close Icon Button (top-right 16px, ghost variant)
    ├── Body (padding: 16px 24px, scrollable if needed)
    └── Footer (padding: 0 24px 24px)
        └── Actions (flex-end, gap: 12px)
            ├── Secondary Button
            └── Primary Button
```

### 6.13 Toast Notification

**Figma Component**: `Toast / [Variant]`

| Property     | Value                                 |
| ------------ | ------------------------------------- |
| **Variants** | `success`, `error`, `warning`, `info` |
| **Width**    | 380px max                             |
| **Radius**   | 12px                                  |
| **Shadow**   | `shadow/toast`                        |
| **Position** | Top-right desktop, top-center mobile  |

### 6.14 Pagination

**Figma Component**: `Pagination`

| Property         | Value                                      |
| ---------------- | ------------------------------------------ |
| **Height**       | 40px                                       |
| **Item Size**    | 40px × 40px                                |
| **Radius**       | 8px                                        |
| **Active State** | `primary/default` bg, `text/inverse` color |
| **Inactive**     | transparent bg, `text/secondary`           |
| **Arrows**       | Previous / Next icon buttons, same size    |

### 6.15 Tab Bar

**Figma Component**: `Tabs`

| Property        | Value                                               |
| --------------- | --------------------------------------------------- |
| **Height**      | 48px                                                |
| **Tab Padding** | 8px 20px                                            |
| **Active**      | `primary/default` bottom border 3px, `text/primary` |
| **Inactive**    | transparent, `text/secondary`                       |
| **Hover**       | `surface/hover` bg                                  |

### 6.16 Photo Upload Zone

**Figma Component**: `Upload / Photo`

This is critical for the report flow.

| Property       | Value                                           |
| -------------- | ----------------------------------------------- |
| **Size**       | 120px × 120px (mobile), 160px × 160px (desktop) |
| **Radius**     | 12px                                            |
| **Border**     | 2px dashed `border/default`                     |
| **Max Photos** | 5                                               |

```
Frame: Photo Upload Grid (wrap, gap: 12px)
├── Upload Slot 1 (dashed border, camera icon + "添加照片" text)
├── Upload Slot 2-5
├── Uploaded Photo (120×120, cover, with delete x top-right)
└── Helper Text (body/caption, text/tertiary): "上传 1-5 张照片，第一张作为封面"
```

---

## 7. Screen Specifications

### 7.0 Global Layout

#### Desktop Layout (1280px)

```
┌──────────────────────────────────────────────────────────────┐
│  Header (72px, fixed top, z200)                              │
│  ┌──────┬───────────────────────────────────────┬──────────┐ │
│  │ Logo │ Nav Links                             │ Actions  │ │
│  └──────┴───────────────────────────────────────┴──────────┘ │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Content Area (max 1280px centered, padding: spacing-10)     │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ 12-column grid content                                    ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  Footer (bg: surface/dark, text: inverse, padding: spacing-10)│
└──────────────────────────────────────────────────────────────┘
```

#### Mobile Layout (360px)

```
┌───────────────────┐
│ Header (56px)     │ ← Hamburger menu + Logo
│                   │
├───────────────────┤
│                   │
│ Content (4 cols)  │ ← Full bleed on mobile
│                   │
│                   │
├───────────────────┤
│ Bottom Nav (64px) │ ← 5 icon tabs
└───────────────────┘
```

---

### 7.1 Screen: Homepage (首页)

**Purpose**: Aggregation hub — latest rescues, featured stories, knowledge entry, and platform stats. Converts visitors to participants.

**Figma Frame**: `Screen / Homepage / Desktop` (1280×2000)

#### Layout Breakdown

```
Section 1: Hero (h: 560px, bg: primary gradient)
├── Left Column (6 cols)
│   ├── Title: display/hero, text/inverse
│   │   "让每一条流浪生命都被看见"
│   ├── Subtitle: body/large, text/inverse @90%
│   │   "连接发现者、救助者、领养者的流浪动物救助协作平台"
│   ├── CTA Buttons (mt: 32px, gap: 16px)
│   │   ├── Primary: "上报流浪动物" → Report flow
│   │   └── Secondary outline: "了解更多" → #about
│   └── Trust Indicators (mt: 32px)
│       └── Stat row: "1,200+ 成功救助" | "800+ 志愿者" | "50+ 救助站"
│
├── Right Column (6 cols)
│   └── Hero Illustration or carousel of success stories (3 cards stacking)
│       ├── Photo frame: rounded, warm border
│       └── Caption: "大黄 → 温暖的家"

Section 2: Stats Bar (h: 120px, bg: surface/default, shadow: shadow/card, mt: -60px overlap)
├── 4 Stat Cards in a row (3 cols each)
│   ├── "累计救助" / "Total Rescued" — number + paw icon
│   ├── "成功领养" / "Adopted" — number + heart icon
│   ├── "活跃志愿者" / "Active Volunteers" — number + people icon
│   └── "救助站点" / "Rescue Shelters" — number + home icon

Section 3: Latest Rescues (mt: spacing-10)
├── Section Header (flex-between)
│   ├── "最新救助" heading/h1 + "实时更新" body/small badge
│   └── "查看全部 →" link
├── Filter Bar (mt: 24px)
│   ├── Search Bar (full variant)
│   ├── Filter Chips: "全部" | "猫" | "狗" | "紧急" | "附近"
│   └── Sort: "最新" dropdown
├── Card Grid (4 columns, mt: 24px)
│   └── 8 Rescue Cards

Section 4: Featured Stories (mt: spacing-10, bg: background/subtle, full-width)
├── Section Header
│   ├── "爱心故事" heading/h1
│   └── "查看全部 →"
├── Story Carousel / Featured Grid
│   ├── 3 Story Cards (horizontal scroll on mobile)
│   │   ├── Before/After photo
│   │   ├── Title (heading/h3)
│   │   └── Snippet (body/small, 2-line clamp)
│   └── Story type tags

Section 5: Knowledge Gateway (mt: spacing-10)
├── Section Header
│   ├── "救助知识" heading/h1
│   └── "查看知识库 →"
├── Category Grid (3 cols)
│   ├── Knowledge Category Card × 6
│   │   ├── Icon (32px, category color)
│   │   ├── Category Name (heading/h4)
│   │   └── Article count (body/caption)
│   └── Categories: 紧急情况 | 猫科救助 | 犬科救助 | 救助流程 | 领养安置 | 经验分享

Section 6: CTA Banner (mt: spacing-10, bg: primary/light, radius: 16px)
├── "想帮助流浪动物？" heading/h2
├── Two CTAs side by side:
│   ├── "成为志愿者" → Volunteer signup
│   └── "浏览待领养动物" → Adoption listing
└── background: subtle paw print watermark pattern

Footer (bg: surface/dark #2F2F2F)
├── 4 columns:
│   ├── Logo + description
│   ├── Quick Links
│   ├── Resources
│   └── Contact / Social
└── Copyright bar
```

#### Mobile Layout Adaptations

```
Hero: stacked (illustration below text), h: auto with min 400px
Stats: 2×2 grid, smaller
Rescue Cards: 1 column, full width
Stories: horizontal scroll carousel
Knowledge: 2 columns
CTA Banner: full width, stacked CTAs
```

---

### 7.2 Screen: Report Flow (流浪动物上报)

**Purpose**: Mobile-first 6-step wizard for reporting stray animals. Designed for stressed users in the field.

**Figma Frame**: `Screen / Report / Mobile` (360×2400) + `Screen / Report / Desktop` (1280×1200)

#### Layout Breakdown (Mobile)

```
Step 1: Photo Upload
├── Progress: Step Indicator (step 1 active)
├── Title: "拍摄或上传照片" heading/h3
├── Subtitle: body/small text/secondary: "清晰的照片能帮助志愿者更快找到动物"
├── Photo Upload Grid (2×3)
│   ├── Main upload slot (large, camera icon)
│   ├── Upload slots 2-5
│   └── Photo tips: "建议从不同角度拍摄"
├── Bottom Bar:
│   ├── Back (disabled on step 1)
│   └── "下一步" Primary Button (full width)

Step 2: Location
├── Step Indicator (step 2 active, step 1 completed ✓)
├── Map Preview (h: 240px, showing GPS pin)
├── Title: "标记位置"
├── Address Field (auto-filled from GPS, editable)
├── GPS accuracy indicator: "定位精度: 15m ✓"
└── Bottom navigation

Step 3: Animal Info
├── Step Indicator (step 3)
├── Title: "动物基本信息"
├── Animal Type Selector (icon cards: Cat / Dog / Other)
├── Count: Stepper (±) if needed
├── Appearance Fields (optional, for identification)
└── Bottom navigation

Step 4: Condition Assessment
├── Step Indicator (step 4)
├── Title: "动物状态评估"
├── Urgency Questions (Yes/No toggles):
│   ├── "是否在流血或明显受伤?"
│   ├── "是否无法移动?"
│   └── "是否在危险位置 (马路/高处)?"
├── Behavior Notes (optional):
│   └── Chip selector: "亲近人" | "警惕" | "有攻击性" | "不确定"
└── Bottom navigation

Step 5: Emergency Level
├── Step Indicator (step 5)
├── Auto-determined urgency display:
│   ├── If any "Yes" → 🔴 紧急 / Urgent visual card
│   └── If all "No" → 🟢 非紧急 / Normal visual card
├── "我们已自动评估紧急程度" explanation
└── Bottom navigation

Step 6: Confirmation & Submit
├── Step Indicator (step 6)
├── Title: "确认信息"
├── Summary Card (all info gathered, scrollable)
│   ├── Photo preview
│   ├── Location map thumbnail
│   ├── Animal type + count
│   ├── Condition summary
│   └── Urgency level
├── Optional: Contact info (default from logged-in user)
├── Disclaimer: "你的联系方式仅用于救助跟进，不会公开"
├── Submit Button: "提交上报" Primary lg, full width
└── Back to edit

Success Screen (replaces flow)
├── Success Icon (72px, green circle, white checkmark)
├── "上报成功！" heading/h2
├── Message body/default:
│   "我们已通知了附近的 12 名志愿者和 3 个救助站。
│    你可以追踪这个案例的后续进展。"
├── Action Cards:
│   ├── "查看我的案例" → Rescue detail
│   └── "了解救助知识" → Knowledge base
└── "继续上报" secondary link (for reporting another animal)
```

#### Desktop Adaptation

On desktop, the report flow becomes a **single-page form with side panel**:

- Left panel (7 cols): Form content, all steps visible at once, vertical scroll
- Right panel (5 cols): Sticky summary card + step indicator

---

### 7.3 Screen: Rescue Case Detail + Timeline

**Purpose**: Full transparency into a rescue case — the most important trust-building screen.

**Figma Frame**: `Screen / Rescue Detail / Desktop` (1280×1800)

```
Section 1: Cover Photo Area
├── Full-width photo carousel (h: 400px)
│   ├── Main photo with gradient overlay (bottom)
│   └── Thumbnail strip below (5 thumbnails, 72px)
├── Overlay on photo:
│   ├── Back button (top-left, 56px)
│   ├── Status Badge (top-right, large variant)
│   ├── Urgency Badge (below status)
│   └── Animal Name + ID (bottom-left, heading/display, text/inverse)

Section 2: Quick Info Bar (below photo)
├── 4 info chips in row:
│   ├── Location (pin icon + "朝阳区花园路")
│   ├── Animal Type (paw icon + "猫 / Cat")
│   ├── Reporter (person icon + "陈女士")
│   └── Time Elapsed (clock icon + "3小时前")

Section 3: Main Content (2-column layout)
├── Left Column (8 cols)
│   ├── Timeline Section ← CORE FEATURE
│   │   ├── Section Title: "救助时间线" heading/h2
│   │   └── Timeline Component (vertical)
│   │       ├── Node: 已领养 — 06/15 (latest, top)
│   │       ├── Node: 待领养 — 06/10
│   │       ├── Node: 康复中 — 06/03
│   │       ├── Node: 已治疗 — 06/01
│   │       ├── Node: 救助中 — 06/01
│   │       └── Node: 待响应 — 06/01 (earliest, bottom)
│   │
│   ├── Description Area (mt: 32px)
│   │   ├── "详细描述" heading/h3
│   │   └── Full description text (body/default)
│   │
│   └── Medical Records (if applicable)
│       ├── "医疗记录" heading/h3
│       └── Medical record card (icon + vet name + date + notes)
│
├── Right Column (4 cols, sticky, top: 88px)
│   ├── Action Card #1: "志愿者行动"
│   │   ├── "认领此案例" Primary Button (full width)
│   │   └── "关注此案例" Secondary Button (full width)
│   │
│   ├── Action Card #2: "案例信息" (mt: 24px)
│   │   ├── Case ID
│   │   ├── Created Date
│   │   ├── Current Status
│   │   ├── Participants count
│   │   └── Share button
│   │
│   └── Action Card #3: "附近救助站" (mt: 24px)
│       └── List of 3 nearby shelters with distance

Section 4: Related (mt: spacing-10)
└── "相关案例" heading/h2
    └── 3 Rescue Cards (horizontal)
```

#### Mobile Layout

```
- Full-width photo (h: 280px)
- Quick info: 2×2 grid
- Timeline: full width, vertical
- Sidebar content: moves below main content
- Sticky bottom bar: "认领/关注" action buttons
```

---

### 7.4 Screen: Adoption Listing

**Purpose**: Browse adoptable animals and submit applications.

**Figma Frame**: `Screen / Adoption Listing / Desktop` (1280×1600)

```
Section 1: Page Header
├── Title: "待领养动物" heading/display
├── Subtitle: "给它们一个温暖的家" body/large text/secondary
└── Stat Chip: "当前 24 只动物等待领养"

Section 2: Filter & Search
├── Search Bar (full width)
├── Filter Row (mt: 16px, gap: 12px)
│   ├── Type: "全部" | "猫" | "狗"
│   ├── Location: City dropdown
│   ├── Age: "全部" | "幼年" | "青年" | "成年" | "老年"
│   ├── Size: Chip selector
│   └── More Filters button (opens filter panel)
└── Sort + View toggle (right aligned)
    ├── Sort: "最新" | "等待最久" | "距离最近"
    └── View: Grid / List toggle

Section 3: Results
├── Card Grid (3 columns)
│   └── Adoption Cards (similar to Rescue Card but with adoption-specific info)
│       ├── Photo (h: 220px)
│       ├── Name + Wait Time ("等待 45 天")
│       ├── Basic Info: Type · Age · Size · Gender
│       ├── Location (city level only for privacy)
│       ├── Personality Tags: "温顺" | "活泼" | "亲人"
│       └── "了解我 →" Link
│
└── Pagination (centered, mt: 48px)

Adoption Detail Page:
├── Photo Gallery (similar to Rescue Detail)
├── Animal Profile Card
│   ├── Basic Info Grid
│   ├── Rescue Timeline (collapsed, expandable)
│   ├── Medical Records (vaccination, sterilization, health notes)
│   ├── Behavior Assessment (structured card)
│   └── Special Needs (if any)
├── Rescue Station Info Card
├── Adoption Application CTA
│   ├── "申请领养" Primary Button
│   └── "收藏" Secondary Button
└── Application Requirements Summary
```

---

### 7.5 Screen: Application Form

**Figma Frame**: `Screen / Adoption Application / Desktop` (1280×1400)

```
Section 1: Form Header
├── Animal Preview (small photo + name, left)
└── "领养申请" Title

Section 2: Application Form (max 720px centered)
├── Personal Info
│   ├── Name, Phone, Email
│   └── ID Verification (optional step)
├── Living Situation
│   ├── Housing Type: "自有房" | "租房" | "与家人同住"
│   ├── Floor Area
│   ├── Has Balcony/Windows safety
│   └── Other Pets at Home
├── Experience
│   ├── Previous pet experience
│   ├── Current pets
│   └── Vet relationship
├── Motivation
│   ├── "为什么想领养？" textarea
│   └── "你对领养的理解" textarea
├── Photo Upload (living environment, optional)
└── Agreement
    ├── "我理解领养是15年的承诺" checkbox
    └── "我同意接受回访" checkbox

Section 3: Submit
├── Primary Submit Button (lg)
├── Cancel link
└── Note: "提交后救助站将在 3 个工作日内联系你"
```

---

### 7.6 Screen: Stories (爱心故事)

**Purpose**: Emotional engine of the platform — before/after rescue stories.

**Figma Frame**: `Screen / Stories / Desktop` (1280×2000)

**Design Direction**: Magazine editorial layout. More whitespace, larger images, serif body text for stories. This is where the design breathes and tells narratives.

```
Section 1: Featured Story (Hero)
├── Full-width image (h: 480px, parallax on scroll)
│   ├── Dark gradient overlay (bottom 40%)
│   ├── Category Tag + Date (top)
│   └── Story Title (heading/display, text/inverse, bottom)
│       └── Author + Read Time (below title)

Section 2: Story Grid
├── Filter: "全部" | "Before/After" | "救助纪实" | "领养日记" | "知识科普"
├── Masonry Grid (variable heights, 3 columns)
│   └── Story Cards:
│       ├── Photo (h: varies, 200-320px)
│       ├── Type Badge (top-left)
│       ├── Title (heading/h3)
│       ├── Excerpt (body/small, 2-line clamp, serif font)
│       ├── Author + Date
│       └── Stats: ❤ 128  💬 24

Story Detail Page:
├── Hero Image (full-width, max-h: 500px)
├── Article Body (max: 720px, centered)
│   ├── Title: heading/display
│   ├── Author Block (avatar + name + date + read time)
│   ├── Story Quote: Patrick Hand font, pull-quote style
│   ├── Body Text: Merriweather serif, 18px, line-height: 1.75
│   ├── Inline Images (full-width)
│   ├── Before/After Comparison (side-by-side image slider)
│   ├── Key Stats Sidebar (rescue days, participants, medical notes)
│   └── Tags
├── "查看完整救助记录 →" link to Rescue Detail
└── Comments Section
```

---

### 7.7 Screen: Knowledge Base (救助知识库)

**Figma Frame**: `Screen / Knowledge Base / Desktop` (1280×1600)

```
Section 1: Header
├── Title: "救助知识库" heading/display
├── Subtitle: "让专业知识不再停留在资深救助者的脑子里"
└── Search Bar (full width, prominent)

Section 2: Category Navigation
├── Category Cards (3×2 grid, mt: 32px)
│   ├── 🚨 紧急情况 (4 articles)
│   ├── 🐱 猫科救助 (8 articles)
│   ├── 🐕 犬科救助 (5 articles)
│   ├── 📋 救助流程 (6 articles)
│   ├── 🏠 领养与安置 (3 articles)
│   └── 💡 经验分享 (12 articles)
│   Each card:
│   ├── Icon (40px, category-specific color)
│   ├── Category Name (heading/h4)
│   ├── Article Count (body/caption)
│   └── Hover: subtle scale + shadow lift

Section 3: Featured Articles (mt: 48px)
├── Section Title + "查看全部 →"
└── Article Cards (3 columns, vertical list)
    ├── Cover Image (optional, h: 160px)
    ├── Category Badge
    ├── Title (heading/h4)
    ├── Excerpt (body/small, 2-line clamp)
    ├── Author + Publish Date
    └── Reading Time + Difficulty Level

Article Detail Page:
├── 2-column layout
│   ├── Left (8 cols): Article Content
│   │   ├── Breadcrumb
│   │   ├── Title + Metadata
│   │   ├── Table of Contents (sticky sidebar, expandable on mobile)
│   │   ├── Body Text (with headings, lists, images)
│   │   ├── Info Boxes (tips, warnings, medical disclaimers)
│   │   └── Download PDF Button
│   └── Right (4 cols): Sidebar
│       ├── Article Info (difficulty, category, tags)
│       ├── Related Articles
│       ├── "这篇文章有用吗？" 👍 👎 feedback
│       └── Related Rescue Cases (if applicable)
```

---

### 7.8 Screen: Volunteer Dashboard

**Purpose**: Mission control for active volunteers — see nearby cases, manage availability.

**Figma Frame**: `Screen / Volunteer / Desktop` (1280×1400)

```
Section 1: Volunteer Status Bar
├── Welcome: "你好, 李明" heading/h2
├── Status Toggle: "在线/暂离" switch + colored indicator
├── Stats: 参与救助 23 次 | 成功 21 次 | 平均响应 12 分钟

Section 2: Nearby Cases Feed
├── Section Header
│   ├── "附近案例" heading/h3
│   └── Radius Selector: "5km" | "10km" | "全城"
├── Case Feed (vertical list, each card TALL)
│   ├── Rescue Card (enhanced)
│   │   ├── Map thumbnail (location focus)
│   │   ├── Distance: "距离你 2.3km"
│   │   ├── Urgency Highlight
│   │   └── Quick Actions:
│   │       ├── "认领" Primary Button
│   │       └── "不参与" Ghost Button
│   └── Pagination / "加载更多"
│
├── Empty State (if no cases nearby):
│   └── Illustration + "当前附近没有待救助的案例"
│       + "扩大搜索范围" button
│       + "查看全部案例" link

Section 3: My Active Cases (if any)
├── Section Header: "我的救助" heading/h3
└── Cards for cases the volunteer has claimed
    ├── Case Preview
    ├── Current Status + Progress
    └── "更新进展" Action Button

Section 4: Volunteer Profile Card (sidebar)
├── Avatar (80px)
├── Name + Level Badge
├── Capability Tags: "擅长猫咪救助" | "有车" | "可临时寄养"
├── Availability: "工作日晚上 + 周末全天"
├── Response Radius: "10km"
└── "编辑资料" Link
```

---

### 7.9 Screen: Profile & Achievements

**Figma Frame**: `Screen / Profile / Desktop` (1280×1600)

```
Section 1: Profile Header
├── Cover Photo Area (h: 200px, warm gradient or hero image)
├── Avatar (120px, overlapping cover bottom)
├── Name + Bio
└── Edit Profile Button

Section 2: Stats Overview
├── 4 Stat Cards in row:
│   ├── "我上报的案例" — X 个 (Y 个已成功救助)
│   ├── "我参与的救助" — X 次志愿者行动
│   ├── "我领养的动物" — X 只
│   └── "我撰写的爱心故事" — X 篇 (Y 次点赞)

Section 3: Achievement Badges (2-column with sidebar)
├── Main (8 cols):
│   ├── Achievement Grid (3 column)
│   │   └── Badge Cards:
│   │       ├── Badge Icon (center, 64px, desaturated if not earned)
│   │       ├── Badge Name (heading/h4, center)
│   │       ├── Description (body/small, center)
│   │       └── Progress Bar (if in progress)
│   │
│   │   Badges:
│   │   ├── 🎯 "第一次上报" — 完成首次流浪动物上报
│   │   ├── 🦸 "第一次救助" — 完成首次志愿者救助
│   │   ├── 🏠 "第一次领养" — 完成首次领养
│   │   ├── ⭐ "救助达人" — 参与 10+ 次救助
│   │   ├── 📝 "故事大王" — 撰写 5+ 篇爱心故事
│   │   ├── 📚 "知识贡献者" — 贡献了 X 篇知识库文章
│   │   ├── 💝 "社区英雄" — 被感谢 X 次
│   │   └── 🔥 "连续救助" — 连续 X 个月参与救助
│   │
│   └── Activity Feed (mt: 48px)
│       └── Timeline of user's platform activity
│
├── Sidebar (4 cols):
│   ├── Role Summary Card
│   │   └── "你正在扮演: 发现者 · 志愿者"
│   ├── Quick Links
│   └── Settings Preview
│       ├── 通知偏好
│       ├── 志愿者状态
│       └── 隐私设置
```

---

### 7.10 Screen: Login / Register

**Figma Frame**: `Screen / Auth / Login` (360×640 mobile, 440px centered on desktop)

```
Desktop: Centered card layout
Mobile: Full-screen

Card (max 440px):
├── Logo (top, centered, 64px)
├── Title: "欢迎回来" / "创建账号" heading/h2
├── Social Login Buttons (optional, mt: 24px)
│   └── Google / WeChat buttons
├── Divider: "或使用邮箱" (with lines on sides)
├── Form:
│   ├── Email Input
│   ├── Password Input (with show/hide toggle)
│   ├── Confirm Password (register only)
│   ├── Name (register only)
│   └── Remember Me checkbox (login only)
├── Submit Button: "登录" / "注册" Primary, full width
├── Link: "忘记密码?" / "已有账号? 登录" (centered)
└── Footer: Terms + Privacy links (body/caption)

Design notes:
- Form centered vertically on page
- Warm, bright feel — not intimidating
- Subtle paw icon decoration in background
```

---

## 8. Responsive Breakpoints

### 8.1 Figma Frame Sizes

Create these master frames in Figma:

| Frame Name     | Width  | Height     | Purpose                    |
| -------------- | ------ | ---------- | -------------------------- |
| Mobile / 360   | 360px  | Per screen | Small phone (iPhone SE)    |
| Mobile / 390   | 390px  | Per screen | Standard phone (iPhone 14) |
| Tablet / 768   | 768px  | Per screen | iPad portrait              |
| Desktop / 1280 | 1280px | Per screen | Standard desktop           |
| Desktop / 1536 | 1536px | Per screen | Wide desktop               |

### 8.2 Responsive Behaviors

| Component   | Mobile (360)        | Tablet (768)                | Desktop (1280+)          |
| ----------- | ------------------- | --------------------------- | ------------------------ |
| Card Grid   | 1 col               | 2 col                       | 3-4 col                  |
| Hero Layout | Stacked             | Side by side (2:1 ratio)    | Side by side (1:1 ratio) |
| Navigation  | Bottom tab bar      | Left sidebar OR top tabs    | Top nav with dropdowns   |
| Timeline    | Full width vertical | Vertical with photos inline | Vertical with photos     |
| Forms       | Full width, stacked | Centered, max 600px         | Centered, max 720px      |
| Story Grid  | 1 col, full width   | 2 col masonry               | 3 col masonry            |
| Sidebar     | Below content       | Right sidebar (narrow)      | Right sidebar (standard) |
| Font Scale  | All sizes -10%      | Standard                    | Standard                 |

---

## 9. Interaction & Motion

### 9.1 Motion Values (from design tokens)

| Token           | Value                                    | Usage                                      |
| --------------- | ---------------------------------------- | ------------------------------------------ |
| `duration-150`  | 150ms                                    | Micro-interactions (hover, focus, toggle)  |
| `duration-200`  | 200ms                                    | Button press, input focus animation        |
| `duration-300`  | 300ms                                    | Page transitions, modal open/close         |
| `duration-500`  | 500ms                                    | Card entrance animations, hero transitions |
| `duration-700`  | 700ms                                    | Story reveal, before/after transitions     |
| `ease-out`      | `cubic-bezier(0, 0, 0.2, 1)`             | Entrances, appearing elements              |
| `ease-in`       | `cubic-bezier(0.4, 0, 1, 1)`             | Exits, disappearing elements               |
| `ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)`           | Most transitions                           |
| `ease-bounce`   | `cubic-bezier(0.68, -0.55, 0.265, 1.55)` | Delight moments (success, achievement)     |

### 9.2 Figma Prototyping Interactions

For the Figma prototype, create these interaction triggers:

| Trigger             | Target Screen                | Animation                           |
| ------------------- | ---------------------------- | ----------------------------------- |
| Tap Rescue Card     | Rescue Detail                | Push left (300ms, ease-standard)    |
| Tap "上报" CTA      | Report Step 1                | Push up (300ms, ease-out)           |
| Tap Status Badge    | Timeline scroll-to           | Smart animate (300ms)               |
| Tap "认领" Button   | Volunteer claim confirmation | Modal slide up (300ms, ease-bounce) |
| Tap Story Card      | Story Detail                 | Smart animate, photo expand         |
| Swipe Photo Gallery | Next photo                   | Smart animate, slide                |
| Pull to Refresh     | Reload content               | Native-like spring                  |
| Scroll              | Parallax on hero             | In Figma: separate frames           |

### 9.3 Micro-interactions (Specify in Figma Variants)

| Component          | Interaction                                  |
| ------------------ | -------------------------------------------- |
| Button hover       | Scale 1.02, shadow increase, 150ms           |
| Card hover         | TranslateY -2px, shadow increase, 200ms      |
| Input focus        | Border 1px→2px, primary color, 150ms         |
| Chip/Tag select    | Background fill animation, 150ms             |
| Like button        | Scale 1.3→1.0 bounce, heart fills red, 300ms |
| Achievement unlock | Scale 0→1 bounce, glow effect, 500ms         |
| Toast appear       | Slide in from right/top, 300ms ease-out      |
| Toast dismiss      | Fade + slide out, 200ms ease-in              |

---

## 10. Figma File Structure

### 10.1 Pages

```
📄 Cover
   └── Project info, version, team, links to design-system

📄 Design Tokens
   ├── 🎨 Color Palette
   ├── 📝 Typography Scale
   ├── 📏 Spacing & Grid
   ├── 🔲 Border Radius
   ├── 🌑 Shadows
   ├── 🎬 Motion Specs
   └── 🖼️ Icon Library

📄 Components
   ├── Buttons (all variants + states)
   ├── Inputs (all types + states)
   ├── Cards (Rescue, Story, Stat, Knowledge)
   ├── Badges (Status, Tag, Count)
   ├── Navigation (Header, Mobile Nav, Footer)
   ├── Timeline
   ├── Step Indicator
   ├── Search Bar
   ├── Empty State
   ├── Modal / Dialog
   ├── Toast
   ├── Pagination
   ├── Tabs
   └── Upload Zone

📄 Screens - Mobile
   ├── Homepage
   ├── Report Flow (Steps 1-6 + Success)
   ├── Rescue Case List
   ├── Rescue Case Detail
   ├── Adoption List
   ├── Adoption Detail
   ├── Application Form
   ├── Stories Feed
   ├── Story Detail
   ├── Knowledge Base
   ├── Article Detail
   ├── Volunteer Dashboard
   ├── Profile & Achievements
   ├── Login
   └── Register

📄 Screens - Desktop
   ├── Homepage
   ├── Rescue Case Detail
   ├── Adoption List + Detail
   ├── Stories Feed + Detail
   ├── Knowledge Base + Article
   ├── Volunteer Dashboard
   └── Profile

📄 Prototypes
   └── Linked interactive flows connecting all screens
```

### 10.2 Component Naming Convention

```
[Category] / [Component] / [Variant] / [State]

Examples:
- Button / Primary / Large / Default
- Button / Primary / Large / Hover
- Badge / Status / Pending
- Card / Rescue / Default
- Card / Rescue / Hover
- Input / Text / Default
- Input / Text / Focus
- Input / Text / Error
```

### 10.3 Auto Layout Rules

All components should use Figma Auto Layout with:

- Direction: Vertical (most cards, forms) or Horizontal (chips, button groups, nav)
- Gap: Use the spacing scale values (4, 8, 12, 16, 24, 32, 48)
- Padding: Consistent with component specs above
- Resizing: Hug contents for buttons, Fill container for cards/inputs
- Constraints: Center for desktop content, Left+Right for mobile full-width

---

## Appendix A: Icon System

| Icon Set                 | Style          | Size Scale       | Usage          |
| ------------------------ | -------------- | ---------------- | -------------- |
| Phosphor Icons (primary) | Regular weight | 16, 20, 24, 32px | UI elements    |
| Custom paw/brand icons   | Filled, warm   | 24, 32, 48, 64px | Brand moments  |
| Status indicator dots    | Filled circle  | 8, 12px          | Badges, status |

**Key Icons to include in Figma:**

- Paw, Heart, Home, Search, Bell, User, Map Pin, Clock, Camera, Upload
- Navigation: Arrow Left/Right, Close/X, Menu/Hamburger, Check, Plus
- Social: Share, Like (heart outlined + filled), Comment
- Status: pending (clock), inProgress (sparkle), treated (medical cross), recovering (heart pulse), awaitingAdoption (home), adopted (heart filled), failed (pause)
- Rescue: cat silhouette, dog silhouette, transport/car, first-aid kit
- Knowledge: book, article, video, download/PDF

---

## Appendix B: Screen-to-Figma Checklist

For each screen, ensure:

- [ ] Uses correct Figma Text Styles (Section 3)
- [ ] Uses correct Figma Color Styles (Section 2.1)
- [ ] Uses correct Figma Effect Styles (Section 2.1)
- [ ] Snaps to the grid (Section 5)
- [ ] Components are instances, not detached
- [ ] Auto Layout is applied to all frames
- [ ] States are covered (default, hover, active, disabled, error, empty, loading)
- [ ] Responsive variants exist (mobile 360, tablet 768, desktop 1280)
- [ ] Copy is consistent with UX writing principles
- [ ] Status colors match the rescue status mapping

---

> **Next Step**: Import this brief into Figma. Start with **Design Tokens** page → **Components** page → **Screens** page in order. Each page builds on the previous one.
