# PawHaven Figma Design Specification

> **CANONICAL SOURCE**: `packages/design-system/figma/src/app/App.tsx`
>
> All design decisions — colors, layout dimensions, typography, spacing, icons, copy, and component structure — MUST be verified against this file. This document is a convenience reference and MAY be outdated. When there is any discrepancy, the App.tsx code wins.
>
> Analyzed: 2025-04-04

---

## 1. Overview

PawHaven is a collaborative platform connecting **reporters, rescuers, clinics, and adopters** — turning fragmented cries for help into a transparent rescue pipeline. The site is a **single-page design** rendered as a Figma site with inline Tailwind CSS.

---

## 2. Page Structure

The page is composed of **8 sections** from top to bottom:

### 2.1 Navigation Bar

Sticky header with frosted-glass effect:

- **Background**: `rgba(255, 250, 245, 0.88)`, `backdrop-filter: blur(12px)`
- **Border bottom**: `1px solid` border color
- **Height**: `4rem` (h-16)
- **Max width**: `6xl` (72rem), centered with horizontal padding

**Left — Logo:**

- 32×32 rounded-lg orange (`bg-primary`) box with 🐾 emoji in white
- Brand name "PawHaven" in Fraunces serif font, `text-xl font-bold`, foreground color
- Hover: logo box scales to `1.05x`

**Center — Nav links** (hidden on mobile `md:flex`):

- 4 items with Lucide icons: **Rescues** (house), **Adopt** (heart), **Knowledge** (book-open), **Stories** (file-text)
- Active item: accent background + primary text color
- Inactive: `text-muted-foreground`, hover → foreground text + muted background
- Each nav item: `px-3 py-2`, `rounded-lg`, `text-sm font-medium`

**Right — CTA:**

- **Sign In** button: `bg-primary text-primary-foreground`, `rounded-lg`, `font-semibold`, shadow-sm, with Lucide `log-in` icon
- Mobile: hamburger menu icon (`lucide-menu`)

---

### 2.2 Hero Section

- **Background**: `rgb(245, 237, 227)` — warm beige
- **Min height**: `520px`
- **Layout**: 2-column flex, left text + right image (46% width, hidden on small screens)

**Left content:**

- **Eyebrow**: `text-[11px] font-bold text-primary uppercase tracking-widest` — "82 rescues in progress right now" with chevron icon
- **Headline**: `text-[4.25rem] font-bold`, Fraunces serif, `line-height: 1.08`, color `#1c1a17` — "Every stray life _deserves_ to be seen." ("deserves" in italic primary color)
- **Subtitle**: `text-[15px] text-[#6b6258]`, max-width `380px`
- **CTA buttons**:
  - "Report a stray now" — `bg-[#1c1a17] text-white`, `rounded-xl`, `px-6 py-3`, semibold, with chevron-right icon
  - "Meet adoptable pets" — `text-[#1c1a17]`, underline on hover

**Stats bar** (below CTAs):

- 3 columns separated by `divide-x divide-[#d4c4b4]`
- Each stat: number in `text-[1.75rem] font-bold text-[#1c1a17]` (Fraunces) + label in `text-xs text-[#9e8e82]`
- Numbers: `8,412` Rescues completed / `3,207` Adopted homes / `1,940` Active volunteers

**Right image:**

- Full-height cover image (`hero-rescue.jpg` — volunteer holding rescued cat and dog)
- Floating card absolute-positioned at bottom-right:
  - `bg-white rounded-2xl shadow-xl`, border `white/60`
  - 36×36 round avatar (Unsplash cat photo)
  - Label: `text-[10px] font-bold text-primary uppercase tracking-wider` — "Just Adopted 🏠"
  - Subtext: `text-xs font-semibold text-[#1c1a17]` — "Mochi found her home"

---

### 2.3 Rescue Cases Section

**Section header:**

- Title: `text-2xl font-bold text-foreground` (Fraunces) — "Rescue Cases"
- Subtitle: `text-sm text-muted-foreground` — "2 pending · 1 in progress"
- Right side: List/Map toggle — segmented control in `bg-card border border-border rounded-lg p-1 shadow-sm`

**Toggle buttons:**

- Active (List): `bg-primary text-white`, `rounded-md`
- Inactive (Map): `text-muted-foreground`, hover → foreground
- Icons: `lucide-list` and `lucide-map`

**Filter pills** (horizontal scroll on mobile):

- `flex gap-1, overflow-x-auto`
- Each pill: `rounded-full px-4 py-2 text-sm font-medium`
- Active: `bg-primary text-white shadow-sm` — "All Cases"
- Inactive: `bg-card border border-border text-muted-foreground`, hover → foreground + muted bg
- Filters: All Cases / Pending / In Progress / Recovering

**Case cards** (2-column grid `sm:grid-cols-2 lg:grid-cols-2`):

Each card:

- Container: `bg-card rounded-2xl overflow-hidden border border-border shadow-sm`, hover → `shadow-lg -translate-y-1`, `cursor-pointer group`
- **Image area** (h-48):
  - Unsplash photo, `object-cover`, hover `scale-105 transition-transform duration-500`
  - Gradient overlay: `bg-gradient-to-t from-black/40 to-transparent`
  - **Status badges** (top-left): colored pills with dot indicators
    - In Progress: `bg-blue-100 text-blue-800`, blue dot
    - Pending: `bg-amber-100 text-amber-800`, amber dot
    - Urgent: `bg-red-100 text-red-700` with `lucide-triangle-alert` icon
  - **Title** (bottom-left): `text-white font-semibold text-lg` (Fraunces) with text-shadow
- **Card body** (p-4):
  - Location: `lucide-map-pin` icon + `text-xs text-muted-foreground`
  - Description: `text-sm text-foreground/80`, 2-line clamp
  - **Footer** (pt-3, border-t):
    - Time: `lucide-clock` + `text-xs text-muted-foreground` — "35 min ago"
    - Distance: `text-xs font-medium text-primary bg-accent`, `rounded-full` with `lucide-map-pin` — "2.1 km"
    - Reporter: `lucide-shield` (blue) + `text-xs text-muted-foreground` — "Li Ming"

---

### 2.4 Adoptable Pets Section

**Section header:**

- Title: "Ready for a Forever Home" (Fraunces)
- Subtitle: "These animals completed their rescue journey and are waiting for you."
- "See all" link

**Pet cards** (4-column responsive grid):

Each card:

- Container: `bg-card rounded-2xl overflow-hidden border border-border shadow-sm`, hover `shadow-lg -translate-y-1`, cursor pointer
- **Image area** (h-52): Unsplash photo, `object-cover`, gradient overlay, hover scale
- **Status badge** (top-left): green `bg-emerald-100 text-emerald-800` — "Adoptable"
- **Card body** (p-4):
  - Pet name: `text-lg font-semibold` (Fraunces)
  - Emoji + info: 🐱/🐕 + age, gender, spay/neuter status — `text-xs text-muted-foreground`
  - **Trait tags**: small `rounded-md` pills with varied backgrounds
    - Gentle: `bg-sky-50 text-sky-700`
    - Playful: `bg-amber-50 text-amber-700`
    - Curious: `bg-violet-50 text-violet-700`
    - Litter-trained / Leash-trained / Intelligent / Active
  - **Footer**: `text-xs text-muted-foreground` — "Waiting X days"

---

### 2.5 Happy Endings / Stories Section

**Section header:**

- Title: "Happy Endings" (Fraunces)
- Subtitle: "Every rescue is a story worth sharing."
- "All stories" link

**Story cards** (3-column grid):

Each card:

- Container: `bg-card rounded-2xl overflow-hidden border border-border shadow-sm`, hover effects
- **Image area** (h-60): Unsplash photo, `object-cover`, gradient overlay
- **Love badge** (absolute top-right): `bg-white rounded-full`, heart icon + count — "284 people loved this story"
- **Card body** (p-5):
  - Title: Fraunces serif, bold
  - Description: `text-sm text-muted-foreground`
  - **Meta tags**: `text-xs text-muted-foreground`
    - People/Rescuer names
    - Rescue duration: "47 days rescue"
    - Volunteer count: "3 volunteers"

---

### 2.6 Knowledge Base Section

**Section header:**

- Title: "Rescue Knowledge" (Fraunces)
- Subtitle: "Professional guides reviewed by veterinarians and certified rescuers."
- "Full library" link

**Article cards** (3-column grid):

Each card:

- Container: `bg-card rounded-2xl overflow-hidden border border-border shadow-sm`, hover effects
- **Icon area** (h-40): `bg-muted`, large emoji centered (🚨, 🐱, etc.)
- **Category tag** (top-left): small rounded pill
  - Emergency: `bg-red-50 text-red-700`
  - Feline Rescue: `bg-violet-50 text-violet-700`
- **Card body** (p-5):
  - Title: Fraunces, `font-semibold`
  - Description: `text-sm text-muted-foreground`, 2-line clamp
  - **Footer meta**:
    - Reading time: `text-xs text-muted-foreground` — "6 min"
    - View count: `text-xs text-muted-foreground` with eye icon — "4,821"

---

### 2.7 CTA Banner Section

Full-width section with warm background:

- **Emoji**: 🐾
- **Headline**: "See a stray animal? You can help." (Fraunces, bold)
- **Body**: "A 60-second report on PawHaven puts trained volunteers in motion. You don't need any special skills — just a phone."
- **Buttons**:
  - "Report a Stray" — `bg-[#1c1a17] text-white`, `rounded-xl`, shadow
  - "Become a Volunteer" — `bg-card border border-border`, `rounded-xl`, shadow-sm

---

### 2.8 Footer

- **Background**: `bg-[#1c1a17]` (near-black)
- Text: white and `#d3c3b3` (warm light brown)

**Grid** (4 columns):
| Column | Heading | Links |
|--------|---------|-------|
| Platform | PLATFORM | Browse Rescues, Report a Stray, Adopt an Animal, Volunteer |
| Resources | RESOURCES | Knowledge Base, Medication Library, Rescue Stories, Emergency Guide |
| Community | COMMUNITY | Volunteer Network, Partner Shelters, Vet Directory, Share a Story |
| Company | COMPANY | About PawHaven, Open Source, Privacy Policy, Terms of Service |

**Brand intro** (above grid):

- Logo (🐾 PawHaven) + tagline
- "A collaborative platform connecting reporters, rescuers, and adopters — from first sighting to forever home."

**Stats row** (between grid and copyright):

- 3 centered stats with emoji: 🐾 2,841 Animals rescued / 🙌 384 Active volunteers / 🏠 1,203 Adopted
- Numbers in `text-2xl font-bold text-primary` (Fraunces)
- Labels in `text-xs text-[#8f7b69]`

**Bottom bar**:

- Copyright: "© 2025 PawHaven. Open source — MIT License."
- Status indicator: green pulsing dot + "All systems operational"
- Tagline: "Built with ❤️ for every stray life"

---

## 3. Responsive Behavior

- **Mobile** (default): Single column, hamburger nav menu, stacked sections
- **`md`** (768px+): Nav links become visible (`md:flex`), sidebar layouts activate
- **`lg`** (1024px+): Hero right image becomes visible, 2-3 column grids
- **`sm`** (640px+): Cards switch to 2-column grid

Horizontal scroll used for:

- Filter pills (`overflow-x-auto`)
- Section tabs

---

## 4. Key Design Principles

1. **Warm & inviting** — Beige/orange palette, rounded shapes, serif display font for emotional headlines
2. **Trust & credibility** — Real stats displayed prominently (8,412 rescues, 3,207 adopted)
3. **Urgency without panic** — Color-coded status badges (amber=pending, red=urgent, blue=in progress)
4. **Transparent pipeline** — From report → rescue → recovery → adoption, each stage visible
5. **Community-driven** — Reporter names shown, "people loved this story" counters, volunteer counts
6. **Content-first** — Rich Unsplash imagery, detailed animal descriptions, location data, timelines
