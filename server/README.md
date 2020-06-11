# TACC Frontera Web Portal - Server

## Directories

- _`cms`: Isolate assets for the CMS website._
- `conf`: Configure services (like CMS, Nginx, and Docker that runs them).
- _`docs`: Isolate assets for the Tech Docs / User Guide._
- _`media`: Dumped assets for the temporary CMS in which the Portal runs._
- `portal`: Isolate code for the Portal.
- _`static`: Dumped assets for the temporary CMS in which the Portal runs._

Any _`italic`_ directories are dynamically created, thus should be ignored by version control.

## Notes

### `cms/media|static` vs. `./media|static`

The `cms/media` & `cms/static` directories are read by the CMS that creates the website (and shared header). During local CMS development, you may update these directories to reflect CMS changes to the Portal.

The `./media` & `./static` directories are read by the _temporary_ CMS scaffold that hosts the Portal client app. They should not be manipulated during runtime. They will become moot when the Portal client app is hosted without a CMS scaffold.
