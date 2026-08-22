# 🛠️ Project Standards

Enforcing project standards is crucial for maintaining **code quality, consistency, and maintainability** in PawHaven.  
By establishing and following these standards, the project ensures that the codebase remains clean, organized, and scalable as the application evolves.

---

## 1️⃣ ESLint Maintenance in Monorepo

**Purpose:** Ensure consistent code style, catch errors, and enforce coding standards.

**Implementation:**

- ESLint configuration is centralized in the **`libs/eslint`** folder.
- Split into two configs:
  - `web` → for frontend apps (React, JSX/TSX)
  - `node` → for backend services (NestJS, Node.js)
- Each application or package imports the corresponding config based on its environment.

**Workflow:**

- ESLint runs automatically on staged files via `lint-staged` (pre-commit)
- Fixable issues are auto-corrected (`--fix`)
- Ensures all code in the repository follows the rules

**Directory example:**

```
libs/eslint/
├── web/       # Frontend ESLint config
└── node/      # Backend ESLint config
```

---

## 2️⃣ Prettier

**Purpose:** Standardize formatting across the codebase (indentation, line breaks, semicolons, etc.)

**Implementation:**

- Central config at root (e.g., `.prettierrc.cjs`)
- Integrated with ESLint using `eslint-config-prettier`
- Runs on staged files via `lint-staged` (pre-commit)

**Files handled in lint-staged:**

```json
"*.{js,jsx,ts,tsx,mjs,cjs}": [
  "eslint --fix",
  "prettier --write"
],
"*.json": [
  "prettier --write"
],
"*.md": [
  "prettier --write"
]
```

- Only staged files are affected to speed up commits

---

## 3️⃣ Husky

**Purpose:** Enforce pre-commit and commit-msg checks automatically

**Implementation:**

- **Pre-commit hook**:
  - Runs `lint-staged` for ESLint and Prettier
- **Commit-msg hook**:
  - Runs `commitlint` to enforce Conventional Commit messages

**Workflow:**

```
[git commit]
      │
      ├─ pre-commit (Husky)
      │     └─ lint-staged
      │         ├─ eslint --fix
      │         └─ prettier --write
      │
      └─ commit-msg (Husky)
            └─ commitlint (enforce Conventional Commit)
```

- Prevents unlinted/unformatted code or invalid commit messages from entering the repository

---

## 4️⃣ Commit Message

**Purpose:** Maintain a clean, meaningful, and consistent commit history

**Standard:** Conventional Commits

```
feat(scope): description
fix(scope): description
chore: description
docs: description
refactor: description
```

**Examples:**

```
feat(auth): add login via email
fix(rescue:status): correct status transition logic
```

- `commit-msg` Husky hook validates every commit
- Commits not following the standard are rejected
