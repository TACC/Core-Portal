# Customize a CMS

This is all optional. You can develop Core-Portal without CMS customization.

## Basic

To create your own CMS test **content**, [learn Django CMS as we use it](https://tacc-main.atlassian.net/wiki/x/phdv).

To be able to customize CMS **settings** or **secrets**:
1. Run `make stop`.
2. Delete `server/conf/cms/settings_*.py` **directories**.
3. Create CMS settings files:
    ```sh
    touch server/conf/cms/settings_custom.py
    touch server/conf/cms/secrets.py
    touch server/conf/cms/settings_local.py
    ```
4. Run `make start`.

To **emulate** a specific project's CMS **settings**:
1. Visit https://github.com/TACC/Core-Portal-Resources/blob/main/.
2. Navigate to specific project.
3. Use its `cms.settings_custom.py` as your `server/conf/cms/settings_custom.py`.

To **override** any CMS **secrets**, edit `server/conf/cms/settings_local.py`.

To **override** any CMS **settings**, edit `server/conf/cms/settings_local.py`.

## Advanced

To populate content from an existing CMS, follow and adapt instructions to [replicate a CMS database](https://tacc-main.atlassian.net/wiki/x/GwBJAg).

> **Important:** This requires high-level server access or someone to give you a copy of the content.
