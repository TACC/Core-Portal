## Overview

Refactor the styles for Data Files dropdown menus to:
- share more CSS
- use clearer CSS

## Related

* [WP-791](https://tacc-main.atlassian.net/browse/WP-791)
* inspired by https://github.com/TACC/Core-Portal/pull/1018#pullrequestreview-2476250609

## Changes

**`.dropdown-menu`**:
- remove redundant code
- use `<Dropdown>` not `<ButtonDropdown>`[^1]
- clean up styles
- use CSS var's for arrow and border

**`DataFilesBreadcrumbs`**:
- fix layout of menu and button

**`DataFilesBreadcrumbs`**:
- use class not ID
- position via `top` not `margin-top`
- explain menu position value
- explain why positioning is necessary[^2]

[^1]: I don't see `ButtonDropdown` in [latest ReactStrap (v9)](https://reactstrap.github.io/?path=/docs/components-dropdown--dropdown).
[^2]: Not desired, but necessary if we use our custom `<Button>` as is.

## Testing

1. Open Data Files.
2. Click "Add +" button.
    - Verify button is centered.
    - Verify menu is centered.
    - Verify menu is wider than button.
    - Verify elements are otherwise unchanged.
4. Click "Go to ..." button.
    - Verify elements are unchanged.

## UI

| `DataFilesDropdown` | `DataFilesSidebar` |
| - | - |
| <img width="400" alt="DataFilesDropdown" src="https://github.com/user-attachments/assets/c0a35d5b-d304-4625-b94e-6ab7888ec3e4"> | <img width="400" alt="DataFilesSidebar" src="https://github.com/user-attachments/assets/7bec0d60-ec77-45d7-b53d-7c0688d8c75b"> |

## Notes

