"""Tests.

.. :module:: portal.apps.publications.utils_unit_test
   :synopsis: publications utils unit tests.
"""

from types import SimpleNamespace

import pytest

from portal.apps.publications.utils import get_publication_file_objs, get_published_workspace_id


@pytest.mark.parametrize(
    "version,expected",
    [(None, "DRP-1149"), (0, "DRP-1149"), (1, "DRP-1149"), (2, "DRP-1149v2"), (10, "DRP-1149v10")],
)
def test_get_published_workspace_id(version, expected):
    assert get_published_workspace_id("DRP-1149", version) == expected


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
