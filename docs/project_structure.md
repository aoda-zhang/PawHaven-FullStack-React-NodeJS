# 🗄️ Project Structure

PawHaven is organized as a **three-layer monorepo architecture**, separating runnable applications, shared abstractions, and tooling configuration.

This layered structure ensures clear responsibility boundaries and long-term scalability.

---

## 1️⃣ Applications Layer (`apps`)

The `apps` directory contains all runnable systems:

- Frontend applications (`portal`, `admin`)
- Backend services (`gateway`, `core-service`, `auth-service`, `document-service`)

### What This Layer Does

This layer delivers actual runtime behavior:

- Frontend applications handle user interaction and presentation.
- Backend services handle domain logic and API processing.
- Each backend service owns its domain and database.
- The Gateway acts as the single entry point for all external requests.

### Why This Layer Exists Separately

Applications represent deployable units.

Keeping them isolated ensures:

- Independent deployment and scaling
- Clear domain ownership
- Fault isolation between services
- Reduced cross-service coupling

This prevents the system from becoming a tightly coupled monolith.

---

## 2️⃣ Shared Packages Layer (`packages`)

The `packages` directory contains reusable abstractions shared across applications.

This layer centralizes logic and standards that must remain consistent across frontend and backend systems.

### What This Layer Does

It provides:

- Cross-boundary type safety
- Reusable frontend business logic
- Backend infrastructure abstraction
- Unified UI design standards
- Shared internationalization management

### 📦 Shared Packages Overview

| Package         | Used By                                                       | Purpose                                                                                         |
| --------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `shared`        | All frontend apps, all backend apps, all other packages       | Single source of truth for types, constants, pure utilities; enables cross-boundary type safety |
| `frontend-core` | `portal`, `admin`                                             | Framework-agnostic frontend logic layer; isolates business logic from UI                        |
| `design-tokens` | `portal`, `admin`                                             | Ensures visual consistency; contains design tokens, not implementation                          |
| `i18n`          | `portal`, `admin`                                             | Centralized translation management; supports runtime language switching                         |
| `ui`            | `portal`, `admin`                                             | Production-ready component library; built on `design-tokens` tokens                             |
| `backend-core`  | `gateway`, `core-service`, `auth-service`, `document-service` | Infrastructure abstraction; standardizes logging, DB access, error handling across services     |

### Why This Layer Exists Separately

Without a dedicated shared layer:

- Logic would be duplicated across applications
- Type definitions would diverge
- Infrastructure standards would become inconsistent
- UI systems would fragment

By isolating shared abstractions, PawHaven enables reuse while preserving strict application boundaries.

---

## 3️⃣ Tooling Layer (`libs`)

The `libs` directory centralizes repository-wide tooling configuration.

### What This Layer Does

It standardizes:

- Code quality enforcement
- TypeScript compilation behavior
- Linting and formatting rules

### 🔧 Shared Libraries Overview

| Library         | Used By                | Purpose                                                                 |
| --------------- | ---------------------- | ----------------------------------------------------------------------- |
| `eslint-config` | All apps, all packages | Unified code quality enforcement; prevents style drift across teams     |
| `tsconfig`      | All apps, all packages | Consistent TypeScript compilation; reduces config duplication and drift |

### Why This Layer Exists Separately

Tooling configuration should not live inside applications or shared packages.

Centralizing it:

- Prevents configuration drift
- Guarantees consistent standards
- Simplifies long-term maintenance of the monorepo

---

## 🔁 Architectural Model

The repository enforces a strict unidirectional dependency flow:
libs → packages → apps
Lower layers never import from higher layers.

This model ensures:

- Predictable architecture
- Controlled dependency growth
- Clear separation of concerns
- Long-term maintainability

---

## 🎯 Why This Three-Layer Structure?

This structure was chosen to:

- Maintain strict domain boundaries
- Support independent deployment
- Enable safe code reuse
- Prevent cross-layer coupling
- Reflect production-grade monorepo governance
