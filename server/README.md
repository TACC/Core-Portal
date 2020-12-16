# TACC Frontera Web Portal - Server

## Directories

- _`cms`: Isolate assets for the CMS website._
- `conf`: Configure services (like CMS, Nginx, and Docker that runs them).
- _`docs`: Isolate assets for the Tech Docs / User Guide._
- _`media`: Dumped assets for the temporary CMS in which the Portal runs._
- `portal`: Isolate code for the Portal's backend.
- _`static`: Dumped assets for the temporary CMS in which the Portal runs._

Any _`italic`_ directories are dynamically created, thus should be ignored by version control.

## Notes

### `cms/media|static` vs. `./media|static`

The `cms/media` & `cms/static` directories are read by the CMS that hosts the website (and shared header). During local CMS development, you may update these directories to reflect CMS changes to the Portal. You may learn more about [How To Have Local Portal Use Local CMS](https://confluence.tacc.utexas.edu/x/OoC2C).

The `./media` & `./static` directories are read by a CMS scaffold that hosts the Portal client app. They would become moot if the Portal client app were hosted _without_ a CMS scaffold.
