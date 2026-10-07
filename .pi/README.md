<!-- GENERATED FILE. Do not edit. Source: harness-core/. Regenerate with `pnpm harness:generate`. -->

# `.pi/` — generated Pi runtime output

**Everything in this directory is generated.** It is not the source of anything, and it is not edited
by hand. The canonical harness is [`harness-core/`](../harness-core/README.md); this directory is
what the Pi runtime loads.

```bash
pnpm harness:generate   # rebuild this directory from the canonical source
pnpm pi:check           # prove the Pi loader accepts what is here
```

Delete this directory and run `pnpm harness:generate` and it comes back identically. If it does not,
the source changed and nothing regenerated it — which is what
[`harness:check:generated`](../harness-core/validation/README.md) exists to catch.

| What Pi loads                                       | Generated from                                                             |
| --------------------------------------------------- | -------------------------------------------------------------------------- |
| `.pi/capabilities/**/agents/*.md`                   | `harness-core/capabilities/**/agents/*.md`                                 |
| `.pi/capabilities/**/skills/*`                      | `harness-core/capabilities/**/skills/*`                                    |
| `.pi/workflows/*.md`, `.pi/workflows/patterns/*.md` | `harness-core/workflows/**`                                                |
| `.pi/rules/*.md`                                    | `harness-core/rules/*.md`                                                  |
| `.pi/settings.json`                                 | `harness-core/config/model-policy.yaml` + the adapter's translation tables |

The tree mirrors the canonical tree directory for directory, so every relative link in a canonical file
resolves identically here. That is deliberate: rewriting links per runtime would create a second place
a link can be wrong.

## How to use it

1. `/trust` once — project configuration only loads after trust.
2. `/reload` after any `pnpm harness:generate`.
3. The slash commands in the `/` menu are the workflows. Subagents are dispatched by name.
4. Before committing anything under `.pi/`: `pnpm harness:generate`, then `pnpm pi:check`, then
   `pnpm check:links`.

## What is Pi-specific, and why it is here rather than in the source

The adapter, not the canonical source, holds Pi's frontmatter field names, Pi's tool identifiers, the
permission syntax, the dispatch configuration, the package list, and the translation from an abstract
model tier to a runtime thinking level. Those are facts about Pi, and the canonical source is written
so that a second runtime does not mean rewriting nine agents.

See [`adapters/pi/README.md`](../harness-core/adapters/pi/README.md) for the full table and the
reason behind each decision.
