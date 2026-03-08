# Authentication and Authorization Architecture

## Overview

PawHaven uses a cookie-based JWT authentication system across multiple microservices. The flow is centered around:

- API Gateway routing requests to backend services
- Auth Service handling login, registration, refresh, and logout
- Shared JWT Guard and JWT Strategy enforced by default in each service
- Public endpoints explicitly marked with `@PublicAPI()`
- Each microservice owning its own database (auth data lives in the Auth Service DB)

## System Components

- Portal Frontend: collects credentials, sends requests, and keeps only user profile state
- API Gateway: central entry point that forwards cookies and headers to services
- Auth Service: validates credentials, issues tokens, rotates refresh tokens
- Domain Services: core/document/etc; verify tokens and use their own databases
- Shared Auth Infrastructure: JWT Guard, JWT Strategy, and PublicAPI decorator

## Authentication Flows

### 1. Login and Registration

```mermaid
sequenceDiagram
    actor User
    participant Portal as Portal Frontend
    participant Gateway as API Gateway
    participant AuthService as Auth Service
    participant AuthDB as Auth Service DB

    User->>Portal: Enter credentials
    Portal->>Gateway: POST /api/auth/login or /api/auth/register
    Gateway->>AuthService: Proxy request

    Note over AuthService: @PublicAPI bypasses JWT Guard

    alt Login
        AuthService->>AuthDB: Find user by email
        AuthDB-->>AuthService: User record
        AuthService->>AuthService: Verify password hash
        alt Invalid credentials
            AuthService-->>Gateway: 400 Bad Request
            Gateway-->>Portal: Error
            Portal-->>User: Show error
        else Valid credentials
            AuthService->>AuthService: Generate access and refresh tokens
            AuthService->>AuthService: Hash refresh token
            AuthService->>AuthDB: Store refresh token hash
            AuthDB-->>AuthService: Success
            AuthService-->>Gateway: 200 OK + Set-Cookie
            Gateway-->>Portal: Success
            Portal-->>User: Logged in
        end
    else Register
        AuthService->>AuthDB: Check if user exists
        AuthDB-->>AuthService: Result
        alt User exists
            AuthService-->>Gateway: 409 Conflict
            Gateway-->>Portal: Error
            Portal-->>User: Show error
        else New user
            AuthService->>AuthService: Hash password
            AuthService->>AuthDB: Create user
            AuthDB-->>AuthService: User created
            AuthService->>AuthService: Generate access and refresh tokens
            AuthService->>AuthService: Hash refresh token
            AuthService->>AuthDB: Store refresh token hash
            AuthDB-->>AuthService: Success
            AuthService-->>Gateway: 200 OK + Set-Cookie
            Gateway-->>Portal: Success
            Portal-->>User: Registered and logged in
        end
    end
```

**Details**

- Login and registration share the same token issuance and cookie response.
- Refresh tokens are stored as hashes in the Auth Service database.
- Tokens are delivered via HTTP-only cookies; frontend does not store raw tokens.

### 2. Token Verification (Protected Requests)

```mermaid
sequenceDiagram
    actor User
    participant Portal as Portal Frontend
    participant Gateway as API Gateway
    participant Service as Domain Service
    participant JWTGuard as JWT Guard
    participant JWTStrategy as JWT Strategy
    participant ServiceDB as Service DB

    User->>Portal: Access protected resource
    Portal->>Gateway: Request with cookies
    Gateway->>Service: Proxy request

    Service->>JWTGuard: Intercept request
    alt Endpoint is public
        JWTGuard-->>Service: Allow request
        Service-->>Gateway: Response
        Gateway-->>Portal: Response
    else Protected endpoint
        JWTGuard->>JWTStrategy: Validate token
        JWTStrategy->>JWTStrategy: Extract token (cookies or header)
        alt Token valid
            JWTStrategy-->>JWTGuard: Return payload
            JWTGuard->>Service: Attach req.user
            Service->>ServiceDB: Optional user or permission lookup
            ServiceDB-->>Service: Result
            Service-->>Gateway: Response
            Gateway-->>Portal: Response
        else Invalid or missing token
            JWTGuard-->>Service: 401 Unauthorized
            Service-->>Gateway: Error
            Gateway-->>Portal: Error
        end
    end
```

**Details**

- JWT Guard is registered globally in each service via the shared backend-core module.
- `@PublicAPI()` marks endpoints that bypass authentication.
- Each service validates tokens independently and can use its own database for authorization checks.

### 3. Token Refresh

```mermaid
sequenceDiagram
    participant Portal as Portal Frontend
    participant Gateway as API Gateway
    participant AuthService as Auth Service
    participant AuthDB as Auth Service DB

    Portal->>Gateway: POST /api/auth/refresh
    Gateway->>AuthService: Proxy request

    Note over AuthService: @PublicAPI bypasses JWT Guard

    AuthService->>AuthService: Extract refresh token
    alt Refresh token present
        AuthService->>AuthService: Verify token signature
        AuthService->>AuthDB: Lookup user by token payload
        AuthDB-->>AuthService: User + stored hash
        AuthService->>AuthService: Compare token with stored hash
        alt Match
            AuthService->>AuthService: Generate new access and refresh tokens
            AuthService->>AuthService: Hash new refresh token
            AuthService->>AuthDB: Update refresh token hash
            AuthDB-->>AuthService: Success
            AuthService-->>Gateway: 200 OK + Set-Cookie
            Gateway-->>Portal: Success
        else No match
            AuthService-->>Gateway: 400 Bad Request
            Gateway-->>Portal: Error
        end
    else Missing token
        AuthService-->>Gateway: 400 Bad Request
        Gateway-->>Portal: Error
    end
```

**Details**

- Refresh rotates both access and refresh tokens.
- A refresh token is valid only if it matches the stored hash for that user.
- Refresh can be triggered explicitly (client call) or implicitly (AuthRefreshMiddleware).

**AuthRefreshMiddleware behavior**

- Attempts refresh when no access token, expired token, or token nearing expiry.
- On success: updates both response cookies and the request object for downstream handlers.
- On failure: clears cookies only when there is no valid access token; otherwise keeps the current token.

## Component Details

### API Gateway

- Acts as a single entry point for all client requests.
- Routes requests to the appropriate microservice and forwards cookies and headers.

### Auth Service

- Handles login, registration, refresh, and logout.
- Stores password hashes and refresh token hashes in its own database.
- Issues tokens and writes HTTP-only cookies in the response.

### JWT Guard and JWT Strategy (Shared)

- Provided by the shared backend-core package and imported by each microservice.
- JWT Guard enforces authentication by default.
- JWT Strategy validates the token and returns a normalized user payload.

### PublicAPI Decorator

- Marks endpoints as public to bypass the global JWT Guard.

### Auth Refresh Middleware

- Centralizes auto-refresh behavior for services that opt in.
- Keeps active sessions seamless by refreshing tokens before they expire.

## Logout

- Logout clears auth cookies and invalidates refresh token state in the Auth Service database.
- Clients should clear local user state and redirect to login.

## Security Considerations

- Use secure, HTTP-only cookies to prevent client-side access.
- Store refresh tokens as hashes and rotate on each refresh.
- Hash passwords using a strong one-way algorithm.
- Avoid leaking sensitive details in error responses and logs.
