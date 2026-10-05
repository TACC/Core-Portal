# Customize a CMS

To seed standard CMS settings overwrites:

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

To emulate another project's CMS settings: copy its `cms.settings_custom.py` from [Core-Portal-Deployments](https://github.com/TACC/Core-Portal-Deployments/blob/main/) to `server/conf/cms/settings/overwrites/settings_custom.py`.

## Advanced

[Replicate a CMS database](https://tacc-main.atlassian.net/wiki/x/GwBJAg) (needs server access or a dump from someone who has it).
