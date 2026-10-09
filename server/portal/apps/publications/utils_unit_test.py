"""Tests.

.. :module:: portal.apps.publications.utils_unit_test
   :synopsis: publications utils unit tests.
"""

from types import SimpleNamespace

import pytest

from portal.apps.publications.utils import (
    get_landing_namespace,
    get_landing_page_path,
    get_publication_file_objs,
    get_published_workspace_id,
)


@pytest.mark.parametrize(
    "version,expected",
    [(None, "DRP-1149"), (0, "DRP-1149"), (1, "DRP-1149"), (2, "DRP-1149v2"), (10, "DRP-1149v10")],
)
def test_get_published_workspace_id(version, expected):
    assert get_published_workspace_id("DRP-1149", version) == expected


@pytest.mark.parametrize(
    "version,suffix",
    [(None, ""), (1, ""), (2, "v2"), (10, "v10")],
)
def test_get_landing_page_path_names_the_versions_published_system(version, suffix):
    path = get_landing_page_path("test.project-1", version)
    assert path == f"/published-datasets/test.project.published.test.project-1{suffix}"


@pytest.mark.parametrize(
    "prefix,namespace",
    [
        ("/published-datasets", "publications"),
        ("https://digitalporousmedia.org/published-datasets", "publications"),
        ("https://digitalporousmedia.org/published-datasets/", "publications"),
        (None, "public"),
        ("", "public"),
        ("https://cep.test/public-data", "public"),
        ("https://cep.test/data/tapis/projects", "public"),
        ("https://cep.test/published-datasets/elsewhere", "public"),
    ],
)
def test_get_landing_namespace_follows_the_datacite_url_prefix(settings, prefix, namespace):
    settings.PORTAL_PUBLICATION_DATACITE_URL_PREFIX = prefix
    assert get_landing_namespace() == namespace


def test_get_landing_page_path_is_under_public_data_for_other_portals(settings):
    settings.PORTAL_PUBLICATION_DATACITE_URL_PREFIX = None
    assert get_landing_page_path("test.project-1", 2) == "/public-data/test.project.published.test.project-1v2"


def test_get_publication_file_objs_combines_root_and_entity_nodes_in_place():
    root_file = {"type": "file", "path": "/a.csv"}
    entity_file = {"type": "file", "path": "/entity/b.csv"}
    publication = SimpleNamespace(
        value={"fileObjs": [root_file]},
        tree={"nodes": [{"id": "NODE_ROOT"}, {"id": "e1", "value": {"fileObjs": [entity_file, root_file]}}]},
    )

    file_objs = get_publication_file_objs(publication)

    # The stored dicts themselves, not copies, and not deduplicated.
    assert file_objs == [root_file, entity_file, root_file]
    assert file_objs[1] is entity_file


@pytest.mark.parametrize("value,tree", [({}, None), ({"fileObjs": None}, {}), ({}, {"nodes": [{"value": None}]})])
def test_get_publication_file_objs_tolerates_missing_parts(value, tree):
    assert get_publication_file_objs(SimpleNamespace(value=value, tree=tree)) == []
