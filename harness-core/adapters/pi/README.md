# Pi adapter

The thin Pi runtime adapter. It points `.pi/settings.json` at `harness-core/` so Pi loads skills,
prompts, and rules **directly from canonical source** — nothing is copied. The harness-core directory
is the only source of truth; this adapter holds only the wiring Pi needs to find it.

This is the **only** place Pi-specific facts live. Everything here — the `settings.json` key names, the
extension that injects rules, the agent-projection step, the package list, and the abstract-tier →
runtime-thinking mapping — would be wrong in canonical source, because canonical source is runtime-neutral
and a second runtime must not require rewriting nine agents.

## What `.pi/` is, and is not

`.pi/` is a **reference**, not a build output.

| `.pi/` path                   | What it is                                                                                                                                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `settings.json`               | Points Pi's `skills:`/`prompts:`/`extensions:`/`packages:` at `harness-core/` and `adapters/pi/`.                                                                                                 |
| `extensions/harness.ts`       | The Harness Agent Bridge: loads `harness-core/rules/*.md` and injects them into the system prompt. No rule content is duplicated.                                                                 |
| `agents/<plugin>__<agent>.md` | The **one** projection: a rendered copy of `harness-core/plugins/<plugin>/agents/<name>.md` (frontmatter transformed to Pi's format, body copied verbatim). Pi can only discover agents this way. |
| `npm/`                        | Pi-managed install tree for declared `packages`.                                                                                                                                                  |

There is **no** `.pi/skills/` or `.pi/prompts/` directory, and no rules tree under `.pi/`. Those would
be a second copy of canonical content and the drift the harness forbids. If any appears, delete it.

## Why a reference rather than a generation

Pi's loaders accept a directory path and recurse for `SKILL.md` (skills) and read prompt templates from
a directory (`prompts`). There is no value in copying `harness-core/plugins/*/skills` into `.pi/skills`
when Pi can read `harness-core/plugins` directly. Rules are not a Pi concept at all, so they are injected
as system-prompt context by the extension — also without duplication. Only agents have no "load from
external path" API, so the single `.pi/agents/` projection exists.

## The agent projection

`sync-agents.mjs` is the one place `.pi/agents` is written:

```
harness-core/plugins/<plugin>/agents/<name>.md
                |
                |  render Pi frontmatter (tool mapping, permission boundary, dispatch config) + copy the body verbatim
                v
         .pi/agents/<plugin>__<name>.md
```

Nothing is transformed. It also resolves each canonical agent's `modelTier` frontmatter to the `thinking`
level Pi expects and writes that into `settings.json`'s `subagents.agentOverrides`. Re-run whenever a
canonical agent changes.

## Translation decisions

`model-policy.mjs` holds the one Pi-specific mapping: `resolveAgentTiers` maps each agent's abstract
tier (`modelTier` frontmatter) to a thinking level (and, only if the policy pins one, a model).
`model-policy.yaml` defines what each tier means. The canonical source names tiers; this adapter names
runtimes.

## Running it

```bash
node harness-core/adapters/pi/sync-agents.mjs   # project canonical agents into .pi/agents
node harness-core/adapters/pi/validate.mjs      # Pi's own loader accepts the runtime
node harness-core/adapters/pi/smoke.mjs         # Pi wires it together (grants, dispatch, tiers)
```

Or, from the repo root: `pnpm pi:sync`, `pnpm pi:check`, `pnpm pi:smoke`.

## What this adapter must not do

- Copy skills, prompts, or rules into `.pi/`. Reference them in `settings.json` instead.
- Read or write a provider model identifier into canonical source.
- Keep a hand-maintained file under `.pi/` other than the agent projection; everything else is disposable.
- Approximate a capability it cannot express. If Pi cannot represent something, record it as unsupported.
