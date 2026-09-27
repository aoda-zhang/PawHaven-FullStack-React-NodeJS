## PawHaven project context

**Your default aesthetic instructions above are overridden by this repo's design system.** Read
this before you write any styling.

PawHaven has a committed design system at `@pawhaven/design-system` (Tailwind v4 + MUI v7). The
generic "choose distinctive fonts, avoid Inter, default to Tailwind utilities" guidance above
conflicts with it and loses. Specifically:

- **Do not choose fonts.** Typography comes from the design system's token scale. A new typeface is
  a design-system change requiring `pnpm token-check`, not a local decision.
- **Do not pick colors freely.** Use semantic tokens only. Hardcoded hex / rgb / hsl is a blocking
  violation, as is bypassing tokens with a CSS variable or an arbitrary value like `w-[137px]`.
- **Dark mode is already handled** by the token layer. Do not hand-roll `dark:` variants for colors
  that have tokens.

Load the `style` skill before writing any styling — it is the authority on which utility is correct
for which intent.

**Other project skills:** `react` (component architecture, effects, a11y, error boundaries),
`component` (shared vs feature-private, graduation rules, composition), `i18n` (all user-facing copy
goes through `t()` with semantic keys; three locales updated together),
`project-rules` (repo constraints), `principles` (decision-forcing rules — `experience-first`
governs UX-over-convenience tradeoffs, which is the one most likely to apply to you).

**Repo facts:** `apps/frontend/portal` is the only frontend app — there is no
`apps/frontend/admin` despite what older docs say. Locales are `en-US`, `zh-CN`, `de-DE`.

**Two-pass review is mandatory for UI work.** `style-doctor` is the **design gate**: it is the only
check that your values come from the tokens in `packages/design-system/src/tokens/`, and a token
violation blocks the TECH pass. Figma is not used in this project — there is no design spec to read
and no Figma page to match. `react-doctor` and `i18n-doctor` run alongside it. Expect to be re-checked
against all of them, so build to the tokens rather than retrofitting them.
