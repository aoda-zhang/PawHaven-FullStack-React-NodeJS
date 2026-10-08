# Security review

Does the change hold this repository's trust model and leave no reachable hole?

**Every security finding is `BLOCKING`.** No exceptions, and no severity discount for a small diff. A
missing auth declaration, an unvalidated boundary, an exposed secret, or an injection vector blocks
however contained it looks.

This dimension applies to **every** review. A diff that touches no backend and no secret still has an
authentication surface: where the diff changes what a route requires, or what a client sends, or what
a service returns, this dimension applies.

## The trust model this repository runs

One non-negotiable invariant, and most findings here are breaches of it:

- **The gateway alone owns browser cookies and browser JWTs.**
- **The gateway signs a short-lived internal token for the target service, and passes it in a
  dedicated header.**
- **Downstream services never see a browser token.** Their internal-token guard fails closed, and
  handlers read identity from the injected claims parameter — never from a raw header or a cookie.

The full model, and the reasoning, is in
[authentication-architecture.md](../../../../../../docs/architecture/authentication-architecture.md).
Judge the diff against it; do not restate it.

## Authentication and authorisation

- **Is a route's identity requirement a decision, or an accident?** The default is "authenticated".
  A route that does not require identity has to say so, deliberately.
- **Is an identity change checked at the point of use?** A check on one endpoint does not authorise
  another.
- **Is authorisation decided from a claim the caller cannot influence?**
- **Does a handler read identity from the injected claims, never from the raw request?** Parsing a
  header or a cookie in a handler is blocking, however clean it looks.
- **Does a change to the guard, the claim shape, or the header name reach past the gateway?**

## Input validation

- **Is every inbound boundary validated with a schema from the shared types?** There is no global
  validation pipe, so a body or query parameter without one is unvalidated. Blocking.
- **Is the schema the same one the other side validates with?** A schema redeclared on the backend is
  two sources of truth for one contract.
- **Is a value that reaches a query, a path, a command, or a template escaped for that sink?** The
  check is per sink, not per input.
- **Is a size or shape limit present where an unbounded value is accepted?**

## Injection

- **NoSQL / query injection** — an unvalidated object reaching a query filter, or an operator
  expression taken from the request.
- **Command injection** — a request value reaching a shell, an exec, or a spawned process.
- **Template injection** — a request value reaching a template, a path, or a rendered document.
- **Cross-site scripting** — a request or stored value reaching `dangerouslySetInnerHTML`, into a
  `href` or `src`, or into a style value. A URL built from a query parameter is a redirect-to-attacker
  risk as well as a script risk.

## Secrets and sensitive data

- **Is a secret, token, key, or connection string committed, logged, or returned?** Search the diff
  for them; do not assume the reviewer's eye catches a plausible-looking constant.
- **Does an error message or a response body carry internal detail** — a stack, a driver message, a
  file path, an internal host?
- **Is personal data exposed to a role that does not need it,** or returned in a payload nobody reads?
- **Are logs free of credentials and tokens?**

## Transport and headers

- **Is a cookie marked `HttpOnly`, `Secure`, and scoped as narrowly as it can be?**
- **Is cross-origin policy set deliberately** rather than left at a permissive default?
- **Is a cross-origin request made without credentials where credentials are not needed?**

## Dependency and supply chain

- **Does the change add a dependency,** and is it one this repository already uses?
- **Does it add a script that runs at install time?**
- **Does it pull from an unexpected registry?** The workspace pins its registry; a URL that bypasses
  it is a finding.

## Trust between internal services

- **Is an internal endpoint reachable with only an internal claim that a browser could forge?** A
  claim that a client can set is not a trust boundary.
- **Is a service-to-service call authenticated,** or does it rely on network position alone?

## Unsafe redirects and navigation

- **Is a redirect target derived from a request parameter?** A redirect built from user input is an
  open redirect; the safe form validates the target against an allowlist.
- **Is internal navigation going through the router,** rather than a raw history or location
  assignment? See [architecture.md](./architecture.md).

## Reporting a security finding

A security finding names the **attack path**, not just the pattern:

- where the untrusted input enters
- what sink it reaches, and what stands between them
- what the attacker gains
- the smallest change that closes it

A pattern match with no attack path is a candidate, not a finding — and it stays `BLOCKING` when the
path is real.
