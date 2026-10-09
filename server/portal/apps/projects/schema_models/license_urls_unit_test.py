import pytest
from django.test import override_settings

from portal.apps.projects.schema_models.license_urls import (
    LICENSE_SPDX_IDS,
    LICENSE_URLS,
    resolve_license_spdx_id,
    resolve_license_url,
)

PORTAL_LICENSE_SETTINGS = override_settings(
    PORTAL_PUBLICATION_LICENSE_URLS={"CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/"},
    PORTAL_PUBLICATION_LICENSE_SPDX_IDS={"CC BY 4.0": "CC-BY-4.0"},
)


@pytest.mark.parametrize("license_value", [None, ""])
def test_resolve_license_url_returns_none_for_unset_license(license_value):
    assert resolve_license_url(license_value) is None


@pytest.mark.parametrize("label,url", LICENSE_URLS.items())
def test_resolve_license_url_maps_known_labels(label, url):
    assert resolve_license_url(label) == url


@pytest.mark.parametrize(
    "url",
    ["https://creativecommons.org/licenses/by/4.0/", "http://opendatacommons.org/licenses/by/1-0/"],
)
def test_resolve_license_url_passes_urls_through(url):
    assert resolve_license_url(url) == url


def test_resolve_license_url_returns_none_for_unmapped_label():
    """Callers treat this as a misconfiguration (see _get_license / _get_rights_list)."""
    assert resolve_license_url("Some Unlisted License") is None


@pytest.mark.parametrize("url", LICENSE_URLS.values())
def test_license_urls_are_absolute_https(url):
    assert url.startswith("https://")


@pytest.mark.parametrize("label,spdx_id", LICENSE_SPDX_IDS.items())
def test_resolve_license_spdx_id_from_label_or_its_url(label, spdx_id):
    assert resolve_license_spdx_id(label) == spdx_id
    assert resolve_license_spdx_id(LICENSE_URLS[label]) == spdx_id


@pytest.mark.parametrize(
    "license_value", [None, "", "Some Unlisted License", "https://creativecommons.org/licenses/by/4.0/"]
)
def test_resolve_license_spdx_id_returns_none_without_known_id(license_value):
    assert resolve_license_spdx_id(license_value) is None


def test_every_spdx_id_has_a_license_url():
    """An SPDX id for a label LICENSE_URLS doesn't map would never be reached by DataCite's
    rightsList, which needs the URL first."""
    assert set(LICENSE_SPDX_IDS) <= set(LICENSE_URLS)


@PORTAL_LICENSE_SETTINGS
def test_portal_license_settings_extend_built_in_labels():
    assert resolve_license_url("CC BY 4.0") == "https://creativecommons.org/licenses/by/4.0/"
    assert resolve_license_spdx_id("CC BY 4.0") == "CC-BY-4.0"
    assert resolve_license_spdx_id("https://creativecommons.org/licenses/by/4.0/") == "CC-BY-4.0"
    # The built-in labels still resolve alongside them.
    assert resolve_license_url("ODC-BY 1.0") == LICENSE_URLS["ODC-BY 1.0"]


@override_settings(PORTAL_PUBLICATION_LICENSE_URLS={"ODC-BY 1.0": "https://example.com/odc-by"})
def test_portal_license_settings_override_built_in_labels():
    assert resolve_license_url("ODC-BY 1.0") == "https://example.com/odc-by"
