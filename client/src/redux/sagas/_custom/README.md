# Custom Sagas

Portal-specific redux sagas live here, one file per portal (named for the
portal's lowercased namespace, e.g. `drp.sagas.js`). Core code stays
portal-agnostic and never imports from `_custom` directly — it resolves each
portal's saga by name at runtime, so a portal that ships nothing here just runs
the core sagas.

When the custom saga is started, core dynamically imports the matching
`<portal>.sagas.js` and forks its default export, letting a portal watch for and
respond to its own actions alongside the core sagas.
