# Custom Components

Portal-specific frontend code lives here, one folder per portal (named for the
portal's lowercased namespace, e.g. `drp/`). Core code stays portal-agnostic and
never imports from `_custom` directly — it resolves each portal's code by name at
runtime, so a portal that ships nothing here just gets the core defaults.

Core loads a portal's code through two entry points:

- **Addons:** `useAddonComponents` resolves each requested addon to a portal's
  matching file under its folder, falling back to the core default when none
  exists.
- **Routes:** `AppRouter` loads a portal's `CustomRoutes.jsx`, if present.

A portal's folder also holds the supporting code its addons and routes use, such
as constants, metadata field definitions, utilities, hooks, and other components.
