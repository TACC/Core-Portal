# Customize a CMS

This is all optional. You can develop Core-Portal without CMS customization.

## Basic

To create your own test content, [learn Django CMS as we use it](https://tacc-main.atlassian.net/wiki/x/phdv).

To emulate a specific project's CMS settings:
1. Visit https://github.com/TACC/Core-Portal-Resources/blob/main/.
2. Navigate to specific project.
3. Copy its `cms.settings_custom.py` to your `server/conf/cms/settings_custom.py`.

To override any standard or custom CMS settings, edit `server/conf/cms/settings_local.py`.

> **Note:** If your `settings_custom.py` and `settings_local.py` are directories, then they were not properly created before starting environment. To fix:
> 1. Run `make stop`.
> 2. Delete directories named `settings_….py`
> 3. [Add CMS settings.](../README.md#CMS)
> 4. Run `make start`.


## Advanced

To populate content from an existing CMS, follow and adapt instructions to [replicate a CMS database](https://tacc-main.atlassian.net/wiki/x/GwBJAg).

> **Important:** This requires high-level server access or someone to give you a copy of the content.
