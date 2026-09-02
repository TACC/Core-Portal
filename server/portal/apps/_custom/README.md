# Custom Apps

Portal-specific backend code lives here, one package per portal (named for the
portal's lowercased namespace, e.g. `drp/`). Core code stays portal-agnostic and
never imports from `_custom` directly — it resolves each portal's package by name
at runtime, so a portal that ships nothing here just runs the core behavior.

Each package is a small Django module holding that portal's own endpoints,
models, metadata mappings, and constants — for example `views.py` for request
handlers, `urls.py` to route to them, and `models.py`/`schema.py` for
a portal's domain-specific data shapes. Core discovers the package by the portal's
namespace and mounts its `urls.py` under `api/<portal>/`, so these endpoints sit
alongside the core API without any core code referencing the portal directly.
