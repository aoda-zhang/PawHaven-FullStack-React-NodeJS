# react-hook-form — Anti-Pattern Catalogue

Every fix in this file is stated once, in `SKILL.md`. This catalogue is the
diagnosis: what the symptom looks like, why it breaks, and which section of the body
holds the rule. Check a diff against it before reporting a form done.

| Anti-pattern                               | Why it breaks                                                                  | Rule |
| ------------------------------------------ | ------------------------------------------------------------------------------ | ---- |
| `useState` for every input                 | Duplicates the form's own state and re-renders the component on each keystroke | §3.1 |
| Manual validation without Zod              | Scattered logic; no type inference                                             | §1.1 |
| A hand-written TS type beside the schema   | The two drift on the first new field                                           | §1.3 |
| `watch()` with no field name               | Re-renders on every keystroke of every field                                   | §4.2 |
| Conditional `formState` access             | The Proxy misses the subscription; the update is lost                          | §4.1 |
| `formState.errors.field` in effect deps    | A nested property's identity does not change with its contents                 | §4.3 |
| `Controller` around a native input         | Re-renders the form component for no gain                                      | §3.2 |
| The array index as a `useFieldArray` key   | Breaks on reorder and remove; values land on the wrong row                     | §5.2 |
| Missing `defaultValues`                    | Uncontrolled-to-controlled warning; `isDirty` unreliable                       | §2.1 |
| `mode: 'onChange'` on a large form         | Re-validates everything on every keystroke                                     | §2.3 |
| No `noValidate` on `<form>`                | The browser's own validation competes with Zod's                               | §6.1 |
| `setValue` during render                   | A render loop                                                                  | §8.2 |
| A schema defined inside the form component | Two forms over the same fields cannot share it; it cannot be tested alone      | §1.1 |
