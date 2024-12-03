## Overview

Remove the unnecessary `.data-files-btn` class.

<details><summary>Details</summary>

This class is assigned to buttons that:
- **either** have Bootstrap btn-primary (in which case the `.workbench-content .btn-primary` styles it)
- **or** are our custom `<Button>` (in which case the `composes: c-button` styles it)

</details> 

## Related

* [WP-XYZ](https://tacc-main.atlassian.net/browse/WP-XYZ)

## Changes

* remove assignment of class
* remove styles for class

## Testing

Verify these buttons' style is unchanged:
- "Data Files" → [Add +] button
- "Data Files" → select a file → [Copy]

## UI

https://github.com/user-attachments/assets/e6df8ed7-9228-4e2b-8eaa-a9f8e94e21f5

https://github.com/user-attachments/assets/ef4a2dad-0dd7-4b82-a4bc-e8619b73484a