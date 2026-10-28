from unittest.mock import patch

import pytest
from celery.exceptions import Retry

from portal.apps.datafiles.tasks import monitor_transfer


@pytest.fixture
def transfer_mocks():
    with (
        patch("portal.apps.datafiles.tasks.get_user_model"),
        patch("portal.apps.datafiles.views.get_tapis_client") as get_client,
        patch("portal.apps.datafiles.tasks.Notification.objects.create") as notify,
        patch("portal.apps.datafiles.tasks.tapis_indexer.apply_async") as index,
    ):
        yield get_client.return_value, notify, index


def check_transfer():
    monitor_transfer.run(
        username="username",
        source_system="my-data",
        response={"uuid": "transfer-id", "systemId": "workspace", "path": "shared/file.txt", "pending": True},
    )


def test_completed_transfer_notifies_and_indexes(transfer_mocks):
    client, notify, index = transfer_mocks
    client.files.getTransferTask.return_value.status = "COMPLETED"
    check_transfer()
    client.files.getTransferTask.assert_called_once_with(transferTaskId="transfer-id")
    assert index.call_count == 2
    assert index.call_args_list[0].kwargs["kwargs"]["filePath"] == "shared"
    payload = notify.call_args.kwargs
    assert payload["status"] == "SUCCESS"
    assert payload["message"] == "File copied to shared"
    assert payload["extra"]["transfer_complete"] is True
    assert payload["extra"]["response"]["pending"] is False


@pytest.mark.parametrize("status", ["ACCEPTED", "IN_PROGRESS"])
def test_incomplete_transfer_retries_without_notifying(transfer_mocks, status):
    client, notify, index = transfer_mocks
    client.files.getTransferTask.return_value.status = status
    with patch.object(monitor_transfer, "retry", side_effect=Retry()) as retry:
        with pytest.raises(Retry):
            check_transfer()
    retry.assert_called_once_with(countdown=30)
    notify.assert_not_called()
    index.assert_not_called()


@pytest.mark.parametrize("status", ["FAILED", "CANCELLED"])
def test_failed_transfer_notifies_without_indexing(transfer_mocks, status):
    client, notify, index = transfer_mocks
    client.files.getTransferTask.return_value.status = status
    check_transfer()
    assert notify.call_args.kwargs["status"] == "ERROR"
    index.assert_not_called()


def test_indexing_error_does_not_hide_completion(transfer_mocks):
    client, notify, index = transfer_mocks
    client.files.getTransferTask.return_value.status = "COMPLETED"
    index.side_effect = RuntimeError("indexing unavailable")
    check_transfer()
    assert notify.call_args.kwargs["status"] == "SUCCESS"


def test_status_lookup_failure_retries(transfer_mocks):
    client, notify, index = transfer_mocks
    client.files.getTransferTask.side_effect = RuntimeError("temporarily unavailable")
    with patch.object(monitor_transfer, "retry", side_effect=Retry()):
        with pytest.raises(Retry):
            check_transfer()
    notify.assert_not_called()


def test_monitoring_timeout_does_not_claim_the_copy_failed(transfer_mocks):
    client, notify, index = transfer_mocks
    client.files.getTransferTask.return_value.status = "IN_PROGRESS"
    with patch.object(type(monitor_transfer.request), "retries", monitor_transfer.max_retries):
        check_transfer()
    assert notify.call_args.kwargs["status"] == "WARNING"
    assert "Unable to confirm" in notify.call_args.kwargs["message"]
    index.assert_not_called()
