# Custom utilities — the `utilities.css` catalogue

Reuse these instead of re-creating the pattern by hand. Each entry lists what the class expands
to, so you can tell whether it covers the case in front of you before you add a near-duplicate.

## Layout utilities

```tsx
flex - center; // display: flex; align-items: center; justify-content: center
flex - between; // display: flex; align-items: center; justify-content: space-between
flex - col - center; // vertical flex with centered content
```

## Button utilities

```tsx
btn - base; // base button reset: inline-flex, centered, medium weight, transitions, focus-ring
btn - primary; // orange bg + white text (combine with btn-base)
btn - secondary; // green bg + white text (combine with btn-base)
btn - outline; // transparent bg + border (combine with btn-base)
button - reset; // full button reset: appearance, bg, border, padding, font, cursor
button - rounded; // rounded button with token-based padding
```

`btn-base` carries the shared behaviour, so a variant without it loses the focus ring and the
transitions:

```tsx
<button className="btn-base btn-primary rounded-xl px-4 py-2">Save</button>
<button className="btn-base btn-outline rounded-xl px-4 py-2">Cancel</button>
```

## Surface utilities

```tsx
card; // white bg, border, shadow-sm, rounded-lg
```

## Form utilities

```tsx
input - field; // full-width input with border, focus ring, transitions
form - error; // error text below form inputs (sm, red)
```

## Link utilities

```tsx
link; // semantic link: primary color, underline on hover, transitions
link - reset; // remove link decoration + inherit color
```

## Accessibility utilities

```tsx
focus - ring; // focus-visible: 2px primary outline + light shadow ring
```

Reach for `focus-ring` on any element that is interactive without being a `button` or `a`, because
those two get their focus styling from the browser and the custom ones do not.
