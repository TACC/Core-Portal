import pytest

from portal.apps.projects.schema_models.orcid import normalize_orcid_id, orcid_url


@pytest.mark.parametrize(
    "value",
    [
        "0000-0002-1825-0097",
        "  0000-0002-1825-0097  ",
        "0000000218250097",
        "https://orcid.org/0000-0002-1825-0097",
        "http://orcid.org/0000-0002-1825-0097/",
        "https://www.orcid.org/0000-0002-1825-0097",
        "orcid.org/0000-0002-1825-0097",
    ],
)
def test_normalize_orcid_id_accepts_known_forms(value):
    assert normalize_orcid_id(value) == "0000-0002-1825-0097"


@pytest.mark.parametrize("value", ["0000-0002-9079-593X", "0000-0002-9079-593x"])
def test_normalize_orcid_id_uppercases_x_check_digit(value):
    assert normalize_orcid_id(value) == "0000-0002-9079-593X"


@pytest.mark.parametrize(
    "value",
    [
        None,
        "",
        "   ",
        "not-an-orcid",
        "1234-5678-9012",
        "0000-0002-1825-00977",
        "0000-0002-1825-0098",  # checksum mismatch
        "https://example.com/0000-0002-1825-0097",  # not orcid.org
        "https://orcid.org/https://orcid.org/0000-0002-1825-0097",
    ],
)
def test_normalize_orcid_id_rejects_invalid(value):
    assert normalize_orcid_id(value) is None


def test_orcid_url():
    assert orcid_url("0000-0002-1825-0097") == "https://orcid.org/0000-0002-1825-0097"
    assert orcid_url("garbage") is None
