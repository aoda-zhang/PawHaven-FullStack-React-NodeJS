# Infrastructure Code Review Reference

Load only when the diff changes CI/CD, deployment configuration, build tooling, runtime entry points, environment wiring, permissions, release steps, or operational behavior.

## Review checklist

- Trigger coverage: push, PR, schedule, manual, branch/ref selection
- Trusted / untrusted PR execution: fork PRs, secret access, permissions
- Token permissions and credential persistence: least privilege, OIDC, short-lived
- Secret exposure: logs, artifacts, env, build args
- Dependency / runtime compatibility: lockfiles, base images, node/python versions
- Environment propagation: staging vs prod, feature flags, config drift
- Artifact paths: upload/download, retention, naming, cross-job sharing
- Timeout / retry behavior: job/step timeouts, flake handling, backoff
- Rollback / recovery: deploy rollback, DB migration rollback, data restore
- Referenced workflow commands exist: scripts, make targets, CLI entry points

## Output

Avoid unrelated redesign. Use the finding format defined by the Reviewer agent.
