---
name: backend-testing
description: >
  How to write a NestJS service and HTTP test in PawHaven: the hand-built persistence double, the
  overridable record factory, the error-path shape, and the assertion that belongs on the typed
  exception rather than the driver's message. Read before writing a backend test or changing one that
  passes against a double the real client would fail.
  Trigger: backend service test nest testing module prisma double mock fixture factory inject
  supertest http e2e badrequest notfound error path.
---

# Backend testing

Cross-stack test methodology — the runner, the placement rule, what a test has to earn — is
[testing-standards](../../../testing/skills/testing-standards/SKILL.md). Read that first. This skill
owns the backend specifics; the worked file is in that skill's reference, because the factory and the
double are one shape.

→ [references/backend-service-tests.md](../../../testing/skills/testing-standards/references/backend-service-tests.md)

## The dependency that bites

The backend-core test config registers a compiler plugin that emits the metadata NestJS needs to
resolve constructor dependencies. Without it, a test that builds a testing module cannot resolve a
constructor parameter at all. That is not a broken test; it is a missing transform. Do not remove the
plugin to make the error go away.

## The five rules

1. **Build records through a factory with overridable defaults.** A literal fixture copied into each
   case drifts the moment a field is added, and the drift is invisible.
2. **Double persistence by hand.** There is no persistence-mocking dependency here. The double is one
   stub per model method, wired into a fake client.
3. **The double must distinguish the call shapes the service actually uses.** A narrow projection is
   not the general case. A double that treats them as one passes a test the real client fails, which
   is the worst kind of green.
4. **Cover the error path.** The double has to accept a failure in place of a result, or the rejection
   branch is unreachable and untested.
5. **Assert on the exception the service throws**, not on the persistence layer's message. The service
   deliberately hides internals from clients; a test that asserts the internals locks in the leak.

## What an HTTP-level test is for

A service test proves logic; an HTTP test proves the contract. Use the second when what you are
checking is the wire shape — the status code, the serialised body, the auth requirement. Do not test
a service through all three layers at once: when it fails you learn nothing about which layer is
wrong.

## Module boundary in tests

A test may reach into the module it is testing. It may not reach into another module's internals to
set up state — a test that needs another module's private shape is evidence that the boundary is
wrong, not that the test needs a workaround.
