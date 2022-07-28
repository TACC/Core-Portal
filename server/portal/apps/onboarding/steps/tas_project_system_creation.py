from portal.apps.onboarding.steps.abstract import AbstractStep
from portal.apps.onboarding.state import SetupState
from portal.apps.webhooks.callback import WebhookCallback
from portal.apps.tas_project_systems.utils import get_tas_project_system_variables
from portal.apps.system_creation.utils import (
    call_reactor,
)
from portal.apps.onboarding.execute import (
    execute_setup_steps,
)
from portal.libs.agave.models.systems.storage import StorageSystem
from requests.exceptions import RequestException
import json
import logging


class TasProjectSystemCreationStep(AbstractStep):
    logger = logging.getLogger(__name__)

    def __init__(self, user):
        """
        Call super class constructor
        """
        super(TasProjectSystemCreationStep, self).__init__(user)

    def display_name(self):
        return "TAS Project Systems"

    def description(self):
        return "Setting up access to data files on the storage systems based on your TAS Projects. No action required."

    def prepare(self):
        self.state = SetupState.PENDING
        self.log("Awaiting storage system creation")

    def process(self):
        tas_project_systems = get_tas_project_system_variables(self.user, force=True)

        # Convert list of tuples to dictionary
        systems = {
            systemId: variables for systemId, variables in tas_project_systems
        }
        self.logger.debug("KeyService variables substituted: {}".format(systems))

        # Create only storage systems that are not currently accessible
        systemList = []
        for systemId in systems.keys():
            try:
                success, _ = StorageSystem(self.user.agave_oauth.client, id=systemId, load=False).test()
            except RequestException as err:
                self.logger.error("Test of system '{}' failed unexpectedly! Listing of system returned: {}".format(self.id, str(err)))
                # we will assume that system needs to be created
                success = False

            if success:
                self.logger.info(
                    "{username} has valid configuration for {systemId}, skipping creation".format(
                        username=self.user.username, systemId=systemId
                    )
                )
            else:
                systemList.append(systemId)

        # If all required systems already exist, mark this step complete
        if len(systemList) == 0:
            self.complete("Found existing storage systems")
            return

        # Store requested systemIds
        data = {
            'requested': systemList,
            'failed': [],
            'successful': []
        }

        for systemId, variables in tas_project_systems:
            result = call_reactor(
                self.user,
                systemId,
                'wma-storage',
                variables,
                force=True,
                dryrun=False,
                callback="portal.apps.onboarding.steps.tas_project_system_creation.TasProjectSystemCreationCallback",
                callback_data={"expected": systemId}
            )
            self.logger.debug(
                "KeyService creation reactor for {} has executionId {}".format(
                    systemId,
                    result['executionId']
                )
            )

        self.log("Creating systems {}".format(str(data['requested'])), data=data)

    def mark_system(self, systemId, status):
        """
        Process callbacks from system creation reactor
        """
        self.logger.debug("KeyService creation for {} {}".format(systemId, status))
        data = self.last_event.data
        try:
            data['requested'].remove(systemId)
            data[status].append(systemId)
            self.log("KeyService creation for {} {}".format(systemId, status), data=data)
        except ValueError:
            self.logger.error(
                "KeyService creation service unexpectedly reported creation of {}".format(systemId)
            )
            # Handle a success report for system creation after a failure report
            if systemId in data['failed'] and status == "successful":
                data['failed'].remove(systemId)
                data['successful'].append(systemId)
                self.log("Retry successful for system creation of {}".format(systemId), data=data)
                self.logger.info("Retry successful for system creation of {}".format(systemId))

        if len(data['requested']) == 0:
            if len(data['failed']) == 0:
                self.complete("KeyService creation complete", data=data)
            else:
                self.fail("KeyService creation failed for one or more systems.", data=data)

            # Re-initiate onboarding event processing sequence
            self.logger.info("Continuing onboarding for {}".format(self.user.username))
            execute_setup_steps.apply_async(args=[self.user.username])


class TasProjectSystemCreationCallback(WebhookCallback):
    logger = logging.getLogger(__name__)

    def __init__(self):
        super(WebhookCallback, self).__init__()

    def callback(self, external_call, webhook_request):
        response = json.loads(webhook_request.body)
        expected = external_call.callback_data['expected']
        step = TasProjectSystemCreationStep(external_call.user)
        if response['result'] == 'success' and response['system']['id'] == expected:
            step.mark_system(expected, 'successful')
        else:
            self.logger.error('KeyService creation reactor callback reported failure')
            self.logger.error("{}".format(response))
            step.mark_system(expected, 'failed')
