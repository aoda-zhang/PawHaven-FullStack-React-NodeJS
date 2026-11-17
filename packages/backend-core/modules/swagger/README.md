# Swagger Module

This module provides automatic OpenAPI/Swagger documentation generation for PawHaven backend services using NestJS Swagger integration.

## Purpose

- **Automatic API documentation**: Generate OpenAPI specs from NestJS decorators
- **Interactive documentation**: Provides Swagger UI for testing APIs
- **Type-safe contracts**: Documentation stays in sync with code
- **API exploration**: Allows frontend teams to explore and test endpoints

## Components

### swagger.module.ts

Module that:

- Exports SwaggerService for configuration
- Can be optionally included per service

### swagger.service.ts

Service that:

- Configures Swagger document builder
- Sets up API information (title, version, description)
- Configures authentication schemes
- Mounts Swagger UI on specified path

## Usage

### Basic Setup

Enable Swagger in your service:

```typescript
import { SharedModule, SharedModuleFeatures } from '@pawhaven/backend-core';

@Module({
  imports: [
    SharedModule.forRoot({
      serviceRoot: __dirname,
      modules: [
        {
          module: SharedModuleFeatures.SwaggerModule,
        },
      ],
    }),
  ],
})
export class AppModule {}
```

### Initialize Swagger in main.ts

```typescript
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('PawHaven Auth Service')
    .setDescription('Authentication and authorization API')
    .setVersion('1.0')
    .addBearerAuth() // Add JWT authentication
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(3000);
  console.log('Swagger UI available at http://localhost:3000/api-docs');
}
bootstrap();
```

### Documenting Endpoints

Use Swagger decorators to document your API:

```typescript
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('users') // Group endpoints
@Controller('users')
export class UserController {
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'List of users',
    type: [UserDto],
  })
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User found',
    type: UserDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }
}
```

### Documenting DTOs

Document request/response schemas:

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    minLength: 8,
    example: 'SecureP@ss123',
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({
    description: 'User display name',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  username?: string;
}

export class UserDto {
  @ApiProperty({ description: 'User ID', example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: 'User display name', example: 'John Doe' })
  username: string;

  @ApiProperty({ description: 'Account creation date' })
  createdAt: Date;
}
```

### JWT Authentication

Document Bearer token authentication:

```typescript
// main.ts
const config = new DocumentBuilder()
  .setTitle('API')
  .addBearerAuth({
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'Enter JWT token',
  })
  .build();

// controller.ts
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth() // Require JWT for this endpoint
@Get('/profile')
getProfile(@Request() req) {
  return req.user;
}
```

### Response Examples

Provide response examples:

```typescript
@ApiResponse({
  status: 200,
  description: 'Successful response',
  schema: {
    example: {
      status: 200,
      isSuccess: true,
      message: 'Request successful',
      data: {
        id: '507f1f77bcf86cd799439011',
        email: 'user@example.com',
        username: 'John Doe',
      },
    },
  },
})
@Get('/users/:id')
getUser(@Param('id') id: string) {
  return this.userService.findOne(id);
}
```

## Advanced Features

### Multiple API Versions

Document different API versions:

```typescript
// v1.controller.ts
@ApiTags('v1/users')
@Controller('v1/users')
export class UsersV1Controller {}

// v2.controller.ts
@ApiTags('v2/users')
@Controller('v2/users')
export class UsersV2Controller {}
```

### Custom Decorators

Create custom API decorators:

```typescript
// decorators/api-paginated-response.decorator.ts
import { applyDecorators, Type } from '@nestjs/common';
import { ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

export const ApiPaginatedResponse = <TModel extends Type<any>>(
  model: TModel,
) => {
  return applyDecorators(
    ApiOkResponse({
      schema: {
        allOf: [
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
              meta: {
                type: 'object',
                properties: {
                  total: { type: 'number' },
                  page: { type: 'number' },
                  pageSize: { type: 'number' },
                },
              },
            },
          },
        ],
      },
    }),
  );
};

// Usage
@ApiPaginatedResponse(UserDto)
@Get('/users')
findAll() {}
```

### File Upload Documentation

```typescript
import { ApiConsumes, ApiBody } from '@nestjs/swagger';

@Post('upload')
@ApiConsumes('multipart/form-data')
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      file: {
        type: 'string',
        format: 'binary',
      },
    },
  },
})
uploadFile(@UploadedFile() file: Express.Multer.File) {
  return { filename: file.originalname };
}
```

### Enum Documentation

```typescript
enum UserRole {
  Admin = 'admin',
  User = 'user',
  Guest = 'guest',
}

export class UserDto {
  @ApiProperty({
    enum: UserRole,
    description: 'User role',
    example: UserRole.User,
  })
  role: UserRole;
}
```

## Best Practices

1. **Always use ApiTags**: Group related endpoints for better organization
2. **Document all responses**: Include success and error responses
3. **Provide examples**: Help API consumers understand expected data
4. **Keep DTOs documented**: Every property should have ApiProperty
5. **Version your APIs**: Use tags to distinguish API versions
6. **Secure endpoints**: Use ApiBearerAuth on protected routes

## Configuration Options

### DocumentBuilder Options

```typescript
const config = new DocumentBuilder()
  .setTitle('API Title')
  .setDescription('API Description')
  .setVersion('1.0')
  .setTermsOfService('https://example.com/terms')
  .setContact('API Team', 'https://example.com', 'api@example.com')
  .setLicense('MIT', 'https://opensource.org/licenses/MIT')
  .addServer('http://localhost:3000', 'Development')
  .addServer('https://api.pawhaven.com', 'Production')
  .addBearerAuth()
  .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' })
  .build();
```

### SwaggerModule Options

```typescript
SwaggerModule.setup('api-docs', app, document, {
  swaggerOptions: {
    persistAuthorization: true, // Remember auth tokens
    docExpansion: 'none', // Collapse all sections
    filter: true, // Enable search
    showRequestDuration: true, // Show request timing
  },
  customSiteTitle: 'PawHaven API Docs',
});
```

## Accessing Documentation

Once configured, access Swagger UI at:

```
http://localhost:3000/api-docs
```

Download OpenAPI spec at:

```
http://localhost:3000/api-docs-json
```

## Troubleshooting

**Problem**: DTOs not showing in Swagger  
**Solution**: Add `@ApiProperty()` to all DTO properties, ensure DTOs are referenced in controllers

**Problem**: Authentication not working in Swagger UI  
**Solution**: Click "Authorize" button in Swagger UI, enter Bearer token

**Problem**: Endpoints not grouped correctly  
**Solution**: Use `@ApiTags()` on controllers

**Problem**: Examples not displaying  
**Solution**: Use `example` property in `@ApiProperty()` or `schema.example` in `@ApiResponse()`

## Production Considerations

Disable Swagger in production for security:

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Only enable Swagger in non-production
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('API')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);
  }

  await app.listen(3000);
}
```

Or protect with authentication:

```typescript
import * as basicAuth from 'express-basic-auth';

app.use(
  '/api-docs',
  basicAuth({
    users: { admin: 'secret-password' },
    challenge: true,
  }),
);
```

---

For questions or issues, contact the backend team.
