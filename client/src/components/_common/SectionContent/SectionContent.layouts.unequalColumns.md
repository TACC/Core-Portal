# `<SectionContent>` Layouts with Unequal Columns

## Caveats

1. This component can **not** automatically make the right column small.\
   _Section styles must define which panels are in the right column and set their width via `var(--column-width--small)`. Setting the width of left column panels via `var(--column-width--small)` is recommended but not required._

2. This component can **not** automatically hide the expected column overflow.\
   (For automatic hiding, use this component via `<Section contentLayoutName>`.)
   _Section styles must hide the overflow. , this component will automatically hide the overflow._

## Examples

### Indirectly Via `<Section>` **← Recommended**

Markup:

```jsx
<Section contentLayoutName="twoColumnUnequal">
  <article>Widget 1</article>
  <article>Widget 2</article>
  <article>Widget 3</article>
  <article>Widget 4</article>
  <article>Widget 5</article>
</Section>
```

Styles:

```css
/* Use the two-column breakpoint when setting width */
/* FAQ: You may vary the media query, but reference `./[…]layouts.module.css` */
@media only screen and (min-width: 992px) {
  /* Panel Container */
  .panels {
    width: var(--column-width--container);
  }

  /* Panels */
  /* FAQ: The first two panels could take up entire height of large left column
          (which would push the remaining panels to the next column over) */
  .content > *:nth-child(-n + 2) {
    height: 50%; /* WARNING: You may need `calc()` to subtract vert. margin */
    /* width: var(--column-width--large); */ /* (optional, implicit) */
  }
  /* FAQ: 3rd & later panels are in second column which is given small width */
  .content > *:nth-child(n + 3) {
    /* height: auto; */ /* (optional, implicit) */
    width: var(--column-width--small);
  }
}
```

> **Note**: The variables come from `SectionContent.layouts.module.css`.

### Directly Via `<SectionComponent>`

Markup:

```jsx
/* The same as "Indirectly Via `<Section>`" */
```

Styles:

```css
/* ... */
@media only screen and (min-width: 992px) {
  /* To hide the expected overflow from `.panels` expanded width */
  .root /* or whatever selects the parent of the panel container */ {
    /* .global(.some-global-section-name) { */
    /* .global(#some-global-section-id) { */
    overflow-x: hidden;
  }

  /* Then... the same as "Indirectly Via `<Section>`" */
}
```

## Variables

These variables are declared and defined by `SectionContent.layouts.module.css`:

- `--column-width--container`
- `--column-width--large`
- `--column-width--small`

Per section, you could change the values to get different widths. Good luck.[^1]

[^1]: The math for `--column-width--small` value was challenging to figure out.
