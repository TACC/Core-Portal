# TACC Frontera Web Portal - Styles

These files are organized via [ITCSS][itcss].

[itcss]: https://www.xfive.co/blog/itcss-scalable-maintainable-css-architecture/ "Inverted Triangle CSS"

## `global.css`

Meant to be imported by a stylesheet that is loaded at the root of the application, i.e. `index.css`.

_This file imports, in [ITCSS][itcss] order, all stylesheets from this directory that should be available globally._

## Pending FP-103/FP-420

FP-103/FP-420 ([PR #26](https://github.com/TACC/Frontera-Portal/pull/26/)) will provide more styles and documentation.

## Trumps

Utilities and helper classes with ability to override anything before it.

_These can be used via `composes:` by one or many React components._
