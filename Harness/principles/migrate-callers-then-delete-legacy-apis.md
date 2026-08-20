# Migrate Callers Then Delete Legacy APIs

Introduce the new API, migrate all callers, and delete the legacy one in one wave.

## When it applies

Introducing a new internal API while old callers exist.

## The rule

Do not leave the old API behind for an indefinite transition period. Add the new API, migrate every caller in the same change set, delete the old one. If the change is too large for one PR, stack the PRs so the deletion lands as part of the same review chain.

## PawHaven notes

- In a monorepo, a package API change means finding all consumers across `apps/` and `packages/` and migrating them in the same wave. `pnpm` workspace references make this tractable; leaving a deprecated export means it will be used forever.
- Delete the dead export rather than marking it `@deprecated`. Deprecation without deletion is procrastination.

## Anti-pattern

New `useUser` API shipped, old `useUserOld` marked deprecated "for now", still imported in three apps six months later.
