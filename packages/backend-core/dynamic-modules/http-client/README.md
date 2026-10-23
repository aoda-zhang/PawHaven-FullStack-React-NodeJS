# HTTP Client Module

Minimal runtime guide for current PawHaven backend usage.

## What It Provides

- `HttpClientService.create(serviceName)` to build a service-scoped HTTP client
- Client methods: `get`, `post`, `put`, `delete`
- Two return modes:
  - default: returns parsed data (`T`)
  - `returnResponse: true` returns full `AxiosResponse<T>`

## Current API

```typescript
type RequestOptions = {
  headers?: Record<string, string>;
  config?: AxiosRequestConfig;
  returnResponse?: boolean;
};

client.get<T>(path, options?)
client.post<T>(path, body, options?)
client.put<T>(path, body, options?)
client.delete<T>(path, options?)
```

## Usage

```typescript
import { HttpClientService } from '@pawhaven/backend-core';

const client = this.httpClientService.create('auth-service');

const data = await client.post('/refresh', payload);

const response = await client.post('/refresh', payload, {
  returnResponse: true,
});
```

## Gateway Refresh

The gateway uses full-response mode to read the refreshed `Set-Cookie` headers:

```typescript
const authClient = this.httpClientService.create('auth-service');
const response = await authClient.post(
  '/refresh',
  {},
  {
    returnResponse: true,
    headers: {
      Cookie: `${cookieKeys.refresh_token}=${refreshToken}`,
    },
  },
);

const setCookieHeaders = response.headers['set-cookie'];
```

## Routing Note

- `create(serviceName)` resolves the target host from `microServices` config.
- Request paths are relative to the selected service; for the Auth Service refresh endpoint, use `/refresh`.

## Error Behavior

- Axios errors are normalized and rethrown as `HttpException`.
- Timeout -> `504`; no response -> `503`; upstream response -> uses the upstream status/message.
