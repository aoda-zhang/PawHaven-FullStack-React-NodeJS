# react — Best Practices

Companion to `SKILL.MD`. Load for generic React component / state / effect / a11y decisions.

## State decision tree

| State                              | Tool                      | Ref               |
| ---------------------------------- | ------------------------- | ----------------- |
| Component-local                    | `useState` / `useReducer` | —                 |
| Cross-component UI (theme, locale) | Context                   | —                 |
| Global client (auth, flags)        | Redux Toolkit             | `redux`           |
| Server/API                         | TanStack Query            | `react-query`     |
| Form                               | React Hook Form + Zod     | `react-hook-form` |

Keep state as local as possible. Never store server state in Redux. Never store derived state.

## Mandatory

- Run `npx react-doctor@latest` after any React change; fix until no new issues.
- React 19: do NOT manually use `useMemo` / `useCallback` / `React.memo` (compiler handles it).
- Functional components only. Named exports. Typed props interface.
- Destructure props in the signature; avoid prop drilling (composition or context at 3+ levels).

## Effects

- Use only for synchronization with external systems, not derived computation.
- Avoid cascading effects — compute during render.
- Always clean up subscriptions/timers/listeners.

## A11y

- Semantic HTML first; ARIA only when needed; WCAG AA contrast (4.5:1).
- Form errors: `role="alert"` + `aria-describedby`. Decorative icons `aria-hidden`.
- Error boundaries around routes / independently-failing features, not every small component.

## Philosophy

Composition > inheritance · derived > duplicated state · local > global · readability > cleverness.
