# Customize a CMS

This is all optional. You can develop Core-Portal without CMS customization.

## Basic

CMS client settings live on the host at `server/conf/cms/settings/overwrites/` — the same path inside the CMS container (`taccsite_cms/settings/overwrites/`).

**First-time setup** (optional files only; `settings_default.py` is already in the repo):

```sh
BASE="https://raw.githubusercontent.com/TACC/Core-CMS/fix/1084-settings-overwrites/taccsite_cms/settings/overwrites"
DIR="server/conf/cms/settings/overwrites"
mkdir -p "$DIR"
for name in settings_custom secrets settings_local; do
  out="$DIR/${name}.py"
  if [ ! -f "$out" ]; then
    curl -fsSL "$BASE/${name}.example.py" -o "$out"
  fi
done
```

To create your own CMS test **content**, [learn Django CMS as we use it](https://tacc-main.atlassian.net/wiki/x/phdv).

To **emulate** a specific project's CMS **settings**:
1. Visit https://github.com/TACC/Core-Portal-Deployments/blob/main/.
2. Navigate to specific project.
3. Use its `cms.settings_custom.py` as your `server/conf/cms/settings/overwrites/settings_custom.py`.

To **override** any CMS **secrets**:
1. Edit `server/conf/cms/settings/overwrites/secrets.py`.

To **override** any CMS **settings**:
1. Edit `server/conf/cms/settings/overwrites/settings_local.py`.

## Advanced

To populate content from an existing CMS, follow and adapt instructions to [replicate a CMS database](https://tacc-main.atlassian.net/wiki/x/GwBJAg).

> **Important:** This requires high-level server access or someone to give you a copy of the content.
