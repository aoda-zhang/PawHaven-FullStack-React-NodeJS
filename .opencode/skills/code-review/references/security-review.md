# Security Code Review Reference

Load when the diff touches identity/session/token handling, authorization, untrusted input/output, uploads/downloads, sensitive data, secrets, permissions, network boundaries, or security configuration.

## Review checklist

- Authentication vs authorization: deny-by-default, role/claim checks, session validation
- Validation / output encoding: XSS, injection, path traversal, SSRF
- Secret / token exposure: logs, error messages, client bundles, env files
- Unsafe deserialization: prototype pollution, code execution
- Sensitive logging: PII, tokens, passwords in logs
- CORS / CSRF / session handling: SameSite, secure flags, origin validation
- Permission expansion: least privilege, scope creep, admin bypass
- Abuse / resource exhaustion: rate limiting, DoS vectors, unbounded loops

## Evidence requirement

Do not label a theoretical concern a confirmed vulnerability without evidence (reproducible path, exploit, or CVE reference).

## Output

Use the finding format defined by the Reviewer agent.
