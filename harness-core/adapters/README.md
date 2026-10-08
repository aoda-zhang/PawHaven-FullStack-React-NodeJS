# Adapters

An adapter translates the canonical harness into one runtime's native layout. It is the only layer that
knows a runtime's field names, tool identifiers, permission model, discovery rules, and package list.

| Runtime     | Status                              | Adapter     |
| ----------- | ----------------------------------- | ----------- |
| **Pi**      | implemented                         | [pi/](./pi) |
| Codex       | architecture-ready, not implemented | none        |
| Claude Code | architecture-ready, not implemented | none        |
| Cursor      | architecture-ready, not implemented | none        |

**No placeholder adapters exist.** An empty directory named after an unimplemented runtime is a promise
a reader will believe, and it is worse than an absent one: the honest state is that
[ARCHITECTURE.md](../ARCHITECTURE.md) and the canonical source already make the runtime possible, and an
adapter is the remaining work.

## What an adapter owns

Everything a runtime needs to know that the canonical source deliberately does not state:

- **Frontmatter field names** and their accepted values.
- **Tool identifiers**, and the mapping from the canonical tool vocabulary to the runtime's names.
- **The permission model** — how "read-only" is actually enforced, and what it does not enforce.
- **Dispatch configuration** — which agent may dispatch, which agents it may reach, and how deep.
- **Model resolution** — the abstract tier mapped to a runtime thinking level and, optionally, a model.
- **Package dependencies** on runtime extensions.
- **Validation against the runtime's own loaders.** This is the one thing an adapter must do that the
  canonical validator must never do.

## What an adapter must not own

- **A rule.** Rules belong to canonical source or to `docs/`.
- **A second copy of a skill.** An adapter transforms; it does not author.
- **A hand-maintained file.** If a generated file needs a change, the change belongs in the source and
  regeneration produces it.
- **A claim it cannot honour.** An adapter that cannot express a capability records it as unsupported
  and says what was lost. It does not approximate, and it does not quietly drop the thing.

## Translation, not mirroring

Canonical source is organised by plugin, agent, skill, workflow, and rule. No runtime lays files out that
way. The adapter maps canonical semantics onto the runtime's native layout — for Pi that means a flat
agent namespace (`.pi/agents/<plugin>__<agent>.md`), a Pi skill tree (`.pi/skills/<plugin>/<skill>/`),
workflow prompts (`.pi/prompts/`), and `settings.json`. The two trees are deliberately different shapes;
that difference is the adapter's whole reason to exist.

## Writing one

1. **Read [ARCHITECTURE.md](../ARCHITECTURE.md) first.** The invariants are what make the adapter
   possible; an adapter that needs a canonical change is reporting that the invariant was wrong.
2. **Model the target's discovery rules before its file formats.** Where it looks, how deep it
   recurses, and what it stops at are what decide the generated layout.
3. **Translate, do not mirror.** Every output must be derivable from the canonical source by a rule in
   the adapter.
4. **Validate with the runtime's own loader**, and keep that code inside the adapter. The canonical
   validator must stay importable without any runtime installed, or the harness can no longer be checked
   on a machine that has none.

## Changing an adapter

A change to an adapter is a harness change: `risk: high`, its own reviewable change, validated with
`pnpm harness:verify`. See [harness-change.md](../workflows/harness-change.md).
