---
name: code-review/figma-doctor
description: >
  Figma design verification gate. Opens the actual Figma design page via Playwright,
  extracts structure via visible text/HTML (low token cost), then takes ONE targeted
  screenshot for visual spot-check. MUST pass before any other code-review doctors run.
  Trigger: Figma design verification visual comparison design-to-code UI match.
version: 3.0
---

# figma-doctor — Figma Design Verification (Gate)

## Responsibility

Verify that the implementation matches the design spec for the specific feature/section being built. This is a **gate step**, but it is **degradable** — live Figma is preferred, yet the review must not be blocked by network/permission/MCP failures for ordinary UI changes.

Uses Playwright MCP to open the real Figma page when possible; falls back to the static `figma-design-spec.md` plus code-structure comparison when live Figma is unavailable.

## Gate Severity

| Target type | Live Figma unavailable | Mismatch found |
|-------------|------------------------|----------------|
| Core visual page (hero, landing, homepage, brand-heavy section) | Warning + manual confirmation | Blocking |
| High-risk change (redesign, layout refactor, new component system) | Warning + manual confirmation | Blocking |
| Ordinary UI / small tweak (button text, spacing tweak, form label) | Use spec fallback; continue with Warning | Warning |
| Non-UI task | Skip gate entirely | N/A |
## Token Budget Awareness

**Screenshots are token-expensive.** Workflow is designed to minimize image analysis:

| Data Source | Token Cost | Use For |
|------------|------------|---------|
| `playwright_get_visible_text` | Low (plain text) | Structure, content, text hierarchy, labels, headings |
| `playwright_get_visible_html` | Medium (HTML) | Component types, nesting, class names, layout patterns |
| `figma-design-spec.md` | Low (markdown) | Cross-reference property values (colors, dimensions, tokens) |
| **1 screenshot of target section** | High (image) | Visual-only checks: spacing feel, color nuance, icon rendering, alignment |

**Rule: ONE screenshot maximum.** Only the target section — not full page. Only take it after structural checks via text/HTML are done.

## Figma URL

```
https://pawhaven.figma.site
```

## Workflow

### Step 0: Determine the target section

From the task context, extract **what is being built** (e.g., "footer", "hero section", "nav bar"). This is the target.

### Step 1: Open the Figma page

```
playwright_navigate: https://pawhaven.figma.site
  width: 1440
  height: 900
```

### Step 2: Extract structure (text-only — cheap)

```
playwright_get_visible_text
```

Parse the visible text to identify:
- Section boundaries and hierarchy
- All text content, headings, labels
- Content order and reading sequence
- Interactive element labels (buttons, links)

### Step 3: Extract structure (HTML — cheap)

```
playwright_get_visible_html
```

Parse the HTML to identify:
- Component types and nesting
- Layout patterns (grid, flex, columns)
- CSS class names (infer spacing, sizing, colors)
- Responsive breakpoints

### Step 4: Cross-reference with design spec (cheap)

```
read_file: .codebuddy/knowledge/figma-design-spec.md
```

Use the spec to confirm exact values that may not be obvious from HTML:
- Color hex values → design token mapping
- Exact dimensions (h-16, max-w-6xl, etc.)
- Font families and sizes
- Border-radius, shadow values
- Interaction states (hover, active behavior descriptions)

### Step 5: ONE screenshot — target section only (the only expensive step)

```
playwright_screenshot:
  name: "figma-{target}"
  selector: CSS selector for the target section (inferred from Step 3 HTML)
  width: 800
```

**Only for visual spot-checking** what text/HTML cannot convey:
- Spacing proportions and alignment
- Color harmony and contrast
- Icon appearance and sizing
- Visual anomalies

### Step 6: Locate implementation code

```
search_file: pattern matching the feature name in apps/frontend/portal/src/
search_content: search for component names, section labels
read_file: the implementation source files
```

### Step 7: Compare — text/HTML structure first, screenshot as sanity check

Compare in this order (cheapest first):

**Text-level** (from Step 2 visible text + implementation):
- All text content matches
- Same headings, labels, CTAs
- Same content order

**Structure-level** (from Step 3 HTML + implementation):
- Same layout pattern (grid, flex, columns)
- Same nesting hierarchy
- Same component types

**Property-level** (from Step 4 spec + implementation):
- Same color tokens
- Same dimensions (width, height, padding, margin)
- Same typography (font, size, weight)
- Same border-radius, shadows
- Same responsive breakpoints

**Visual-level** (from Step 5 screenshot + implementation):
- Spacing feels proportional
- Colors look harmonious
- No visual anomalies

### Step 8: Report

**✅ PASS** → All checks pass. Continue to remaining code-review doctors.

**❌ FAIL** → List every mismatch with file path + line number. Return to development.

## Gate Behavior

```
figma-doctor runs FIRST
  1. Attempt to navigate to live Figma page
     - On success: extract visible text, visible HTML, take ONE screenshot
     - On failure (network/permission/MCP): DEGRADE to Tier 2
  2. Tier 2 fallback: read figma-design-spec.md + compare implementation code structure
  3. Apply gate severity table above
  4. Report ✅ PASS / ⚠️ DEGRADED / ❌ FAIL with severity classification
```

## Two-Tier Fallback

If Playwright MCP cannot access the live Figma page:

1. Read `.codebuddy/knowledge/figma-design-spec.md`.
2. Locate the {target} section in the spec.
3. Read the implementation files for the same {target}.
4. Compare structure, content, tokens, and responsive behavior from the spec.
5. If the spec is ambiguous or missing visual details, mark the gate as ⚠️ DEGRADED and surface the risk in the report. Continue with other doctors.
6. Only treat missing live Figma as Blocking for core visual pages or high-risk changes.

## Tools Required

| Step | Tool | Cost |
|------|------|------|
| Navigate | `playwright_navigate` | Low |
| Structure | `playwright_get_visible_text` | Low |
| Structure | `playwright_get_visible_html` | Medium |
| Reference | `read_file` (spec) | Low |
| Visual spot-check | `playwright_screenshot` (target only, 1 shot) | **High** |
| Find code | `search_file`, `search_content` | Low |
| Read code | `read_file` (implementation) | Low |

## Related

- Design spec source: `.codebuddy/knowledge/figma-design-spec.md`
- After gate passes, run: [style-doctor](./style-doctor/SKILL.MD) · [react-doctor](./react-doctor/SKILL.MD) · [i18n-doctor](./i18n-doctor/SKILL.MD)
