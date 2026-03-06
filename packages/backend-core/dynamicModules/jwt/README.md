# JWT Module

This module provides JWT (JSON Web Token) authentication for the PawHaven backend services, including a global guard and Passport strategy for token validation and user extraction.

## Purpose

- **JWT Guard**: Protects routes by validating JWT tokens from incoming requests
- **JWT Strategy**: Implements Passport.js strategy for extracting and validating JWT tokens
- **Public API Support**: Allows specific routes to bypass JWT authentication using the `@PublicAPI()` decorator

## Components

### JWT.guard.ts

A global guard that extends `AuthGuard('jwt')` from `@nestjs/passport`. It:

- Checks if a route is marked as public using the `@PublicAPI()` decorator
- If public, allows the request without token validation
- If not public, delegates to the JWT strategy for token validation
- Automatically registered globally in SharedModule

### jwt.strategy.ts

A Passport strategy that:

- Extracts JWT from the `Authorization` header (Bearer token)
- Validates the token using the configured secret from ConfigService
- Returns user payload (userId, username) that gets attached to the request object
- Throws an error if JWT secret is not configured

## Usage

### Basic Setup

The JWT module is automatically registered when you import SharedModule:

```typescript
import { SharedModule } from '@pawhaven/backend-core/dynamicModules/shared.module';

@Module({
  imports: [SharedModule.forRoot({ serviceRoot: __dirname })],
})
export class AppModule {}
```

### Configuration

Configure JWT secret in your environment config:

```yaml
# config/development.yaml
auth:
  jwtSecret: 'your-secret-key-here'
  jwtExpiresIn: 1800 # seconds
```

Or via environment variables:

```bash
AUTH_JWT_SECRET=your-secret-key-here
AUTH_JWT_EXPIRES_IN=1800
```

### Protecting Routes

All routes are protected by default due to the global guard. To make a route public:

```typescript
import { PublicAPI } from '@pawhaven/backend-core/decorators';

@Controller('auth')
export class AuthController {
  // This route requires JWT token
  @Get('/profile')
  getProfile(@Request() req) {
    return req.user; // user injected by JWT strategy
  }

  // This route is public (no token required)
  @PublicAPI()
  @Post('/login')
  login(@Body() loginDto: LoginDTO) {
    // Login logic
  }
}
```

### Accessing User Info

Once authenticated, user info is available on the request object:

```typescript
@Get('/me')
getMe(@Request() req) {
  const { userId, username } = req.user;
  // Use user info
}
```

## How It Works

1. **Request arrives** → JWTGuard intercepts
2. **Check for @PublicAPI()** → If present, skip validation and allow request
3. **Extract token** → JwtStrategy extracts token from Authorization header
4. **Validate token** → Token is verified using the configured secret
5. **Attach user** → User payload is extracted and attached to `req.user`
6. **Continue** → Request proceeds to the route handler

## Error Handling

- **No token provided**: Returns 401 Unauthorized
- **Invalid token**: Returns 401 Unauthorized with error details
- **Expired token**: Returns 401 Unauthorized
- **Missing JWT secret**: Throws error on application startup

## Security Considerations

- Always use strong, randomly generated JWT secrets in production
- Store secrets in secure environment variables, never commit them to code
- Consider rotating JWT secrets periodically
- Use appropriate token expiration times (shorter for sensitive operations)
- Validate token payload structure in your business logic if needed

## Extension

### Custom User Validation

Modify the `validate` method in `jwt.strategy.ts` to add custom logic:

```typescript
async validate(payload: any) {
  // Add custom validation logic
  if (payload.role !== 'admin') {
    throw new UnauthorizedException('Insufficient permissions');
  }

  return {
    userId: payload.sub,
    username: payload.username,
    role: payload.role
  };
}
```

### Custom Token Extraction

Modify the `jwtFromRequest` in the strategy constructor:

```typescript
super({
  jwtFromRequest: ExtractJwt.fromExtractors([
    ExtractJwt.fromAuthHeaderAsBearerToken(),
    ExtractJwt.fromUrlQueryParameter('token'),
  ]),
  secretOrKey: secret,
});
```

## Troubleshooting

**Problem**: "Unknown authentication strategy 'jwt'" error  
**Solution**: Ensure JwtStrategy is registered in SharedModule providers

**Problem**: All routes return 401 even with valid token  
**Solution**: Check that JWT secret matches between auth-service (token generation) and other services (token validation)

**Problem**: Public routes still require authentication  
**Solution**: Verify `@PublicAPI()` decorator is properly imported and applied before route decorator

---

For questions or issues, contact the backend team.
