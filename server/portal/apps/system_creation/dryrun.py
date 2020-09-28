from portal.apps.webhooks.callback import WebhookCallback
from portal.apps.system_creation.utils import call_reactor
import json
import logging


class DryrunCallback(WebhookCallback):
    logger = logging.getLogger(__name__)

    def __init__(self):
        super(DryrunCallback, self).__init__()

    def callback(self, external_call, webhook_request):
        self.logger.info("DryrunCallback result")
        self.logger.info("callback_data: {}".format(external_call.callback_data))
        self.logger.info("webhook_request: {}".format(json.loads(webhook_request.body)))


def dryrun_success(user):
    """
    A test function for dry run system creation

    This will dry run creation of a system using templates/data-tacc-work.j2 (in the
    abaco reactor repository) and echo a callback success once the dry run completes
    """
    systemId = "data-tacc-work-{}".format(user.username)
    variables = {
        "rootDir": "TEST_WORK_DIR"
    }
    callback = "portal.apps.system_creation.dryrun.DryrunCallback"
    callback_data = { "var1": "value1" }
    call_reactor(
        user, systemId, "work", variables, 
        dryrun=True,
        force=True,
        callback=callback, 
        callback_data=callback_data
    )


def dryrun_failure(user):
    """
    A test function for dry run system creation failure

    This will dry run creation of a system, but should echo a failure that
    the "rootDir" variable in the template is missing
    """
    systemId = "data-tacc-work-{}".format(user.username)
    variables = { }
    callback = "portal.apps.system_creation.dryrun.DryrunCallback"
    callback_data = {
        "var1": "value1"
    }
    call_reactor(
        user, systemId, "work", variables, 
        dryrun=True,
        force=True,
        callback=callback, 
        callback_data=callback_data
    ) 

