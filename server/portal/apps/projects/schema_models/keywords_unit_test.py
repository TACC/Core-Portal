import pytest

from portal.apps.projects.schema_models.keywords import normalize_keywords


@pytest.mark.parametrize(
    "keywords,expected",
    [
        ("genomics, RNA-seq ,  mouse", ["genomics", "RNA-seq", "mouse"]),
        (["one", " two", "three "], ["one", "two", "three"]),
        (["one", "", "  "], ["one"]),
        ("one,,  ,two", ["one", "two"]),
        ("", []),
        ([], []),
        (None, []),
    ],
)
def test_normalize_keywords(keywords, expected):
    assert normalize_keywords(keywords) == expected
