import pytest

from portal.apps.projects.schema_models.license_urls import LICENSE_URLS, resolve_license_url


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
