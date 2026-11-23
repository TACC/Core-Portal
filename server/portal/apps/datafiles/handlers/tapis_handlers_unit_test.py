import pytest
from django.core.exceptions import PermissionDenied

from portal.apps.datafiles.handlers.tapis_handlers import (
    allowed_actions,
    readonly_actions,
    tapis_get_handler,
)

MUTATING_ACTIONS = sorted(
    {action for actions in allowed_actions.values() for action in actions} - set(readonly_actions)
)


@pytest.fixture
def mock_operations(mocker):
    return mocker.patch("portal.apps.datafiles.handlers.tapis_handlers.operations")


def test_readonly_actions_are_exactly_the_expected_set():
    assert set(readonly_actions) == {"listing", "search", "download", "preview", "detail"}


def test_mutating_actions_are_detected():
    # Guards the parametrization below from silently becoming empty.
    assert {"mkdir", "move", "rename", "trash", "upload", "delete", "copy", "makepublic"} <= set(MUTATING_ACTIONS)


@pytest.mark.parametrize("operation", readonly_actions)
def test_get_handler_allows_readonly_actions(mock_operations, operation):
    client = object()
    result = tapis_get_handler(client, "private", "system", "path", operation, tapis_tracking_id="tid")

    op = getattr(mock_operations, operation)
    op.assert_called_once_with(client, "system", "path", tapis_tracking_id="tid", scheme="private")
    assert result == op.return_value


@pytest.mark.parametrize("scheme", ["private", "public", "community", "projects"])
@pytest.mark.parametrize("operation", MUTATING_ACTIONS)
def test_get_handler_rejects_mutating_actions(mock_operations, scheme, operation):
    with pytest.raises(PermissionDenied):
        tapis_get_handler(object(), scheme, "system", "path", operation)

    # The operation must never be looked up or invoked.
    assert not getattr(mock_operations, operation).called


@pytest.mark.parametrize("operation", ["", "unknown", "__class__", "LISTING"])
def test_get_handler_rejects_unknown_operations(mock_operations, operation):
    with pytest.raises(PermissionDenied):
        tapis_get_handler(object(), "private", "system", "path", operation)


@pytest.mark.parametrize("scheme", ["public", "community"])
def test_get_handler_hides_trash_for_public_and_community(mock_operations, scheme):
    tapis_get_handler(object(), scheme, "system", "path", "listing")

    assert mock_operations.listing.call_args.kwargs["hideTrash"] is True


@pytest.mark.parametrize("scheme", ["private", "projects"])
def test_get_handler_does_not_hide_trash_for_other_schemes(mock_operations, scheme):
    tapis_get_handler(object(), scheme, "system", "path", "listing")

    assert "hideTrash" not in mock_operations.listing.call_args.kwargs
