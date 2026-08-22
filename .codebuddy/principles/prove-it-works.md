# Prove It Works

Verify against the real artifact, not "it compiles" or "looks right".

## When it applies

After a task, before declaring done.

## The rule

"The code looks correct" is not verification. The chain is:

```
implementation → real artifact → runtime/test/evidence → verified
```

Run the actual check: typecheck, unit test, lint, or a render of the real surface. If a check fails, the work is not done. If you cannot run a check, say why and use the closest executable evidence.

## PawHaven notes

- `pnpm typecheck` passes means types hold; it does not mean the feature works.
- A UI change is verified when it renders the intended output on the real surface, not when the JSX looks right.
- A bug fix is verified when the original repro passes, on the same surface that failed (see workflows/bug-fix.md).
- Prefer no new test over a bad test. But "I didn't test it" is not verification either.

## Anti-pattern

Declaring done because the build is green, when the behavior was never exercised.
