# Config Module

Loads a service's configuration bundle for the current runtime environment, validates it against
the service's schema, and exposes it through NestJS `ConfigService`.

## Bundles

Each service ships one JSON bundle per environment, hard-pinned by `ConfigsModule`:

```
apps/backend/<service>/src/config/
├── Config.schema.ts            # zod schema for this service
├── prod/env/index.json
└── uat/env/index.json
```

Only `uat` and `prod` exist. `NODE_ENV` must be one of those two values — there are no aliases and
no fallback, so a stale value fails the boot instead of silently loading another bundle:

```bash
NODE_ENV=uat npm start     # local development, preview deployments
NODE_ENV=prod npm start    # production
```

`getRuntimeEnv` in `@pawhaven/shared/utils` performs the resolution and throws on anything else.

## Resolution order

1. `src/config/<env>/env/index.json`
2. `.env.local.<env>`, `.env.<env>`, `.env.local`, `.env` (in that order)
3. `process.env`

`${VAR}` placeholders inside the JSON are expanded from `process.env`, which is how secrets are
injected without committing them.

## Adding a value

1. Add the field to `apps/backend/<service>/src/config/Config.schema.ts`, reusing a fragment from
   `modules/config/configSchema.ts` where one exists.
2. Add the value to **both** bundles — `uat` and `prod` — in the same change. A key present in one
   bundle and absent from the other fails validation for the missing environment; that is intended.
3. Read it through `ConfigService`, never `process.env`, so the schema stays the single source of
   truth.

## Extension

`ConfigsModule.forRoot({ serviceRoot, serviceName, configSources, configSchema })` handles the
bundle that the service's build step bundles (see `collectServiceConfigSources`). A service that
needs another source implements it in `serviceConfig.ts` and documents it here.
