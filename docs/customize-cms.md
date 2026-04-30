# Customize a CMS

This is all optional. You can develop Core-Portal without CMS customization.

## Basic

To create your own CMS test **content**, [learn Django CMS as we use it](https://tacc-main.atlassian.net/wiki/x/phdv).

To **emulate** a specific project's CMS **settings**:
1. Visit https://github.com/TACC/Core-Portal-Resources/blob/main/.
2. Navigate to specific project.
3. Use its `cms.settings_custom.py` as your `server/conf/cms/settings/settings_custom.py`.

To **override** any CMS **secrets**, edit `server/conf/cms/settings/settings_local.py`.

To **override** any CMS **settings**, edit `server/conf/cms/settings/settings_local.py`.

## Advanced

To populate content from an existing CMS, follow and adapt instructions to [replicate a CMS database](https://tacc-main.atlassian.net/wiki/x/GwBJAg).

> **Important:** This requires high-level server access or someone to give you a copy of the content.
