# Customize a CMS

Optional. You can develop Core-Portal without CMS customization.

Settings: `server/conf/cms/settings/overwrites/` (same path in the CMS container).

Seed optional files (`settings_default.py` is already committed):

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

[Learn Django CMS as we use it](https://tacc-main.atlassian.net/wiki/x/phdv) for test content.

To emulate another project's CMS settings: copy its `cms.settings_custom.py` from [Core-Portal-Deployments](https://github.com/TACC/Core-Portal-Deployments/blob/main/) to `server/conf/cms/settings/overwrites/settings_custom.py`.

Edit `server/conf/cms/settings/overwrites/secrets.py` for secrets. Edit `settings_local.py` in that folder for other settings.

## Advanced

[Replicate a CMS database](https://tacc-main.atlassian.net/wiki/x/GwBJAg) (needs server access or a dump from someone who has it).
