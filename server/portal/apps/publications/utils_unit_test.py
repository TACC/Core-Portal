"""Tests.

.. :module:: portal.apps.publications.utils_unit_test
   :synopsis: publications utils unit tests.
"""

import pytest

from portal.apps.publications.utils import get_published_workspace_id


@pytest.mark.parametrize(
    "version,expected",
    [(None, "DRP-1149"), (0, "DRP-1149"), (1, "DRP-1149"), (2, "DRP-1149v2"), (10, "DRP-1149v10")],
)
def test_get_published_workspace_id(version, expected):
    assert get_published_workspace_id("DRP-1149", version) == expected
