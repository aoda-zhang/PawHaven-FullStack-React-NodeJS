# HTTP Client Module

Minimal runtime guide for current PawHaven backend usage.

## What It Provides

- `HttpClientService.create(serviceName)` to build a service-scoped HTTP client
- Client methods: `get`, `post`, `put`, `delete`
- Two return modes:
  - default: returns parsed data (`T`)
  - `returnResponse: true`: returns full `AxiosResponse<T>`

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

const data = await client.post('/auth-service/refresh', payload);

const response = await client.post('/auth-service/refresh', payload, {
  returnResponse: true,
});
```

## Gateway Refresh (Actual Case)

Gateway JWT refresh needs `Set-Cookie`, so it uses full response mode:

```typescript
const authClient = this.httpClientService.create('auth-service');
const response = await authClient.post(
  '/auth-service/refresh',
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

- `create(serviceName)` resolves host from `microServices` config
- Request path should use routed service prefix, e.g. `/auth-service/...`, `/core-service/...`

## Error Behavior

- Axios errors are normalized and rethrown as `HttpException`
- Timeout -> `504`, no response -> `503`, upstream response -> uses upstream status/message
