# Performance review

Is the change introducing a cost it did not intend? Applies when the diff introduces or alters a hot
path: a query that runs per record or per request, a loop whose bound is not fixed, a payload that
grows with the data set, a subscription with no teardown.

This is the **review dimension**. Diagnosing and fixing a performance problem is a workflow —
[performance-issue.md](../../../../../workflows/performance-issue.md) — and the two are deliberately
separate: a review asks whether the change is cheap, and a performance investigation asks whether
something already slow got slower.

## Measurement is not available to this dimension

A review has no before/after pair. It can identify a cost that is structurally visible in the diff —
an unbounded loop, a query inside a loop, a payload that selects a whole collection. It **cannot**
assert that something is slow, and a review that claims a measurable regression without a measurement
is asserting something it did not establish.

Say which one you are doing: a structural cost visible in the diff, or a measurement you actually ran
and quoted.

## Database and data access

- **Is a query inside a loop?** That is an N+1 and it is `MAJOR` on sight. The fix is a batched
  query or an aggregation, not a per-item call.
- **Is a read fetching a whole collection where a page would do?**
- **Is a write in a loop that could be one operation?**
- **Is an index assumed?** An index that does not exist is not visible in the diff; note it as a
  question rather than a finding.

## Loops and bounds

- **Is there an unbounded loop** driven by data, by a request parameter, or by a queue?
- **Is a recursion whose depth is data-driven?**
- **Is a retry without a ceiling,** or with a backoff that does not grow?

## Memory and resources

- **Is a listener, timer, observer, or subscription created without a teardown?** That is a leak, and
  it is `MAJOR`.
- **Is a collection accumulated without a bound?**
- **Is a large intermediate built where a stream or a page would do?**
- **Is a file, a socket, or a client disposed on every path,** including the failure path?

## Frontend rendering

- **Is a value created inline that every render then sees as a new reference,** defeating a memo or
  re-triggering an effect downstream?
- **Is a component re-rendering because state it does not read lives where it does?**
- **Is an effect firing on every render to derive a value?**
- **Is a large dependency pulled into the initial bundle** that could be loaded on demand?
- **Is an expensive list rendered without the virtualisation or pagination the data volume needs?**

This is the intersection of [frontend.md](./frontend.md) and this dimension. Report a rendering cost
here and the rule it breaks there; file it once.

## Payload and network

- **Is a response selecting fields nobody reads?**
- **Is a list endpoint returning an unbounded collection?**
- **Is the same data requested twice** where one cache would do?
- **Is a polling or refetch interval tighter than the data changes?**

## Caching

- **Does a change invalidate a cache it should,** or leave one stale that a reader will see?
- **Is a cache key missing a field the result depends on?** Two keys that should be one produce two
  requests; two that should differ produce the wrong answer.

## Finding it

Structural costs are found by reading the diff with these questions in mind, not by grepping for
performance anti-patterns — a pattern match here produces a candidate, and a candidate with no cost
story is noise. Name the cost, name the scale at which it hurts, and say what the smaller change
would be. A performance finding that cannot name the scale at which it matters is a preference, not a
finding.
