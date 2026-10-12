# free-model-filter

Keeps only free models — or only paid ones — in the model picker.

**Responsibility:** cost selection only. It knows nothing about coding suitability or context size.

## Options

| Parameter   | Type      | Default   | Description                                                                                      |
| ----------- | --------- | --------- | ------------------------------------------------------------------------------------------------ |
| `freeOnly`  | `boolean` | `true`    | `true` keeps free models and removes paid ones. `false` keeps paid models and removes free ones. |
| `freeMatch` | `string`  | `":free"` | Id substring that marks a model as free.                                                         |

```jsonc
{
  "plugins": [
    {
      "package": "./plugins/free-model-filter",
      "options": { "freeOnly": true, "freeMatch": ":free" },
    },
  ],
}
```

## How a model is classified as free

A model is free when its id contains `freeMatch`, **or** every entry of its `cost` array has `input` / `output` / `cache.read` / `cache.write` equal to `0` (a missing `cache` counts as `0`).

Models with an empty or missing `cost` array are treated as **not** free.
