# context-window-filter

Keeps only models whose context window is at least a given size.

**Responsibility:** context-window length only. It does not look at cost or tool capability.

## Options

| Parameter    | Type     | Default  | Description                                                     |
| ------------ | -------- | -------- | --------------------------------------------------------------- |
| `minContext` | `number` | `131072` | Minimum `limit.context` in tokens. Models below it are removed. |

```jsonc
{
  "plugins": [
    {
      "package": "./plugins/context-window-filter",
      "options": { "minContext": 200000 },
    },
  ],
}
```

## Notes

- A model with a missing or non-numeric `limit.context` counts as `0` and is removed.
- Set `minContext: 0` to disable the filter while keeping the plugin registered.
