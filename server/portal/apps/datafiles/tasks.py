"""Deliver completion notifications for asynchronous Tapis file transfers."""

import logging
import os

from celery import shared_task
from django.contrib.auth import get_user_model

from portal.apps.notifications.models import Notification
from portal.apps.search.tasks import tapis_indexer

logger = logging.getLogger(__name__)


@shared_task(bind=True, queue="default", max_retries=2880)
def monitor_transfer(self, username, source_system, response):
    # Use a fresh client on each check so long transfers survive token refresh.
    from portal.apps.datafiles.views import get_tapis_client

    try:
        user = get_user_model().objects.get(username=username)
        client = get_tapis_client(user, source_system)
        transfer = client.files.getTransferTask(transferTaskId=response["uuid"])
        status = transfer.status
    except Exception as exc:
        if self.request.retries < self.max_retries:
            raise self.retry(exc=exc, countdown=30)
        status = "UNKNOWN"

    if status not in ("COMPLETED", "FAILED", "CANCELLED", "UNKNOWN"):
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=30)
        status = "UNKNOWN"

    if status == "COMPLETED":
        for path, recurse in ((os.path.dirname(response["path"]), False), (response["path"], True)):
            try:
                tapis_indexer.apply_async(
                    kwargs={
                        "access_token": client.access_token.access_token,
                        "systemId": response["systemId"],
                        "filePath": path,
                        "recurse": recurse,
                    },
                    routing_key="indexing",
                )
            except Exception:
                # An indexing outage must not hide a completed transfer.
                logger.exception("Unable to schedule indexing for transfer %s", response["uuid"])

    destination = os.path.dirname(response["path"]) or "/"
    message = f"File copied to {destination}"
    if status == "UNKNOWN":
        message = "Unable to confirm file copy completion. Check the destination before retrying."
    elif status != "COMPLETED":
        message = f"File copy to {destination} {status.lower()}"

    Notification.objects.create(
        event_type="data_files",
        operation="copy",
        user=username,
        status="SUCCESS" if status == "COMPLETED" else "WARNING" if status == "UNKNOWN" else "ERROR",
        message=message,
        read=True,
        extra={"transfer_complete": True, "response": {**response, "pending": False, "status": status}},
    )
