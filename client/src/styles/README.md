# TACC Frontera Web Portal - Styles

These files are all regular native CSS (not CSS modules, not SCSS).

These files are organized via [ITCSS][itcss].

[itcss]: https://www.xfive.co/blog/itcss-scalable-maintainable-css-architecture/ "Inverted Triangle CSS"

## `global.css`

Meant to be imported by a stylesheet that is loaded at the root of the application, i.e. `index.css`.

_This file imports, in [ITCSS][itcss] order, all stylesheets from this directory that should be available globally._

## Settings

Variables for values, media queries, selectors, etc.

_These are __not__ styles. These are variables used to reduce reptition. These can __NOT__ be used via `composes:`._

## Tools

Mixins, functions, and other processing logic.

_These are __not__ styles. These are tools to create styles. These can __NOT__ be used via `composes:`._

## Generic

Styles that cascade to many elements (or reset/normalize styles, but Bootstrap is doing this).

_No classes allowed. These can __NOT__ be used via `composes:`._

## Elements

Styling for bare HTML elements (like `<button>`, `<a>`, `<td>`, etc.).

_No classes allowed. These can __NOT__ be used via `composes:`._

## Objects

Class-based selectors which define undecorated structural patterns, e.g. re-usable layouts.

_These can be used via `composes:` by one or many React components._

## Components

Class-based selectors which define decorated design patterns, e.g. UI components.

_These can be used via `composes:` by one or many React components._

## Trumps

Utilities and helper classes with ability to override anything before it.

_These can be used via `composes:` by one or many React components._
