import pytest

from portal.apps.projects.schema_models.doi import doi_url, normalize_doi


@pytest.mark.parametrize(
    "value",
    [
        "10.1234/abc.def",
        "  10.1234/abc.def  ",
        "doi:10.1234/abc.def",
        "DOI: 10.1234/abc.def",
        "https://doi.org/10.1234/abc.def",
        "http://dx.doi.org/10.1234/abc.def",
        "https://www.doi.org/10.1234/abc.def",
        "doi.org/10.1234/abc.def",
        "HTTPS://DOI.ORG/10.1234/abc.def",
    ],
)
def test_normalize_doi_accepts_known_forms(value):
    assert normalize_doi(value) == "10.1234/abc.def"


def test_normalize_doi_accepts_subdivided_registrant_code():
    assert normalize_doi("https://doi.org/10.1000.10/abc") == "10.1000.10/abc"


def test_normalize_doi_keeps_suffix_case_and_punctuation():
    assert normalize_doi("10.17612/F4H1-W124(x);y") == "10.17612/F4H1-W124(x);y"


def test_normalize_doi_decodes_resolver_url_only():
    assert normalize_doi("https://doi.org/10.1000/a%2Fb%20c") == "10.1000/a/b c"
    # A bare DOI is already the name itself, so a literal "%" in it stays.
    assert normalize_doi("10.1000/50%25") == "10.1000/50%25"


@pytest.mark.parametrize(
    "value",
    [
        None,
        "",
        "   ",
        "not-a-doi",
        "10.x/non-numeric-registrant",
        "10./no-registrant",
        "10.1234/",
        "10.1234/has space",
        "https://example.com/10.1234/abc",  # not a DOI resolver
        "https://doi.org/https://doi.org/10.1234/abc",
    ],
)
def test_normalize_doi_rejects_invalid(value):
    assert normalize_doi(value) is None


def test_doi_url():
    assert doi_url("doi:10.1234/abc") == "https://doi.org/10.1234/abc"
    assert doi_url("garbage") is None
