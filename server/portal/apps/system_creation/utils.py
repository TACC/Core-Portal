from portal.apps.webhooks.utils import register_webhook
from portal.libs.agave.utils import service_account
from portal.apps.auth.tasks import get_user_storage_systems
from portal.apps.webhooks.callback import WebhookCallback
from django.contrib.auth import get_user_model
from django.conf import settings
import logging
import json
from pytas.http import TASClient

logger = logging.getLogger(__name__)


def call_reactor(user, systemId, reactor_template, variables,
                 force=False, dryrun=False, callback=None, callback_data=None):
    """
    Send a message to the System Creation Reactor and register a webhook callback

    :param user:        The user on behalf of whom to invoke the keyservice
    :param systemId:    The expected systemId to be generated, saved in the KeyServiceOperation.
                            The systemId will be verified when a success callback is made.
                            If there is a mismatch between the systemId returned from the actor
                            and the one that was requested, an exception will be generated.
    :param reactor_template:
                        The template key name (in the reactor's metadata.json) for generating the
                            system description
    :param variables:   A dictionary of all variables necessary to create the system.
                            username, publicKey and privateKey will be auto-populated and do not need
                            to be specified. User specific values should already
                            have been applied at this stage using substitute_user_variables
                        ex:
                        {
                            "rootDir": "/work/012345/taccuser",
                            "username": "taccuser",
                            "id": "cep.home.taccuser"
                        }
    :param force:       When True, the system creation service will update any pre-existing system
                            When False, will allow a failure to occur if the system already exists.
    :param dryrun:      When True, system creation service will skip registering keys or agave write operations
    :param callback:    A string denoting the full path name of the KeyServiceCallback subclass to run
                            upon completion of the system creation service
    :param callback_data:   Dictionary to attach to the operation
    """

    agc = service_account()
    webhook = register_webhook(callback, callback_data, user=user)
    message = {
        "username": user.username,
        "force": force,
        "dryrun": dryrun,
        "template": reactor_template,
        "variables": variables,
        "webhook": webhook
    }
    result = agc.actors.sendMessage(actorId=settings.PORTAL_KEY_SERVICE_ACTOR_ID, body=message)

    return result


def substitute_user_variables(user, systemId, variables):
    """
    Utility function to substitute systemId and variables with user specific
    values, such as {username}, {workdir}
    """
    substitutions = _create_substitutions(user)
    systemId = systemId.format(**substitutions)
    variables = _substitute_variables(variables, substitutions)
    return systemId, variables


def force_create_storage_system(username):
    user, created = get_user_model().objects.get_or_create(username=username)

    if created:
        logger.warn("Username {} does not exist locally, creating a virtual user".format(username))

    storage_systems = get_user_storage_systems(
            user.username,
            settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEMS
    )
    logger.debug("Unpacking systems to create: {}".format(storage_systems))

    # Create a list of tuples of systemId, variables from substitute_user_variables
    substituted = [
        substitute_user_variables(user, v['systemId'], v) for _, v in storage_systems.items()
    ]

    for systemId, variables in substituted:
        result = call_reactor(
            user,
            systemId,
            'wma-storage',
            variables,
            force=True,
            dryrun=False,
            callback="portal.apps.system_creation.utils.ForceSystemCreationCallback",
            callback_data={"systemId": systemId}
        )
        logger.info(
            "Forced System Creation reactor for {} has executionId {}".format(
                systemId,
                result['executionId']
            )
        )

def _get_tas_dir(user):
    # Get $WORK directory
    tas_client = TASClient(
        baseURL=settings.TAS_URL,
        credentials={
            'username': settings.TAS_CLIENT_KEY,
            'password': settings.TAS_CLIENT_SECRET
        }
    )
    tas_user = tas_client.get_user(username=user.username)
    return tas_user['homeDirectory']


def _create_substitutions(user):
    substitutions = {}
    substitutions["tasdir"] = _get_tas_dir(user)
    substitutions["username"] = user.username.replace('_', '-')
    substitutions["portal"] = settings.PORTAL_DOMAIN
    return substitutions


def _substitute_variables(variables, substitutions):
    result = variables.copy()
    for k, v in result.items():
        if hasattr(v, 'format'):
            result[k] = v.format(**substitutions)
    return result


class ForceSystemCreationCallback(WebhookCallback):
    logger = logging.getLogger(__name__)

    def __init__(self):
        super(ForceSystemCreationCallback, self).__init__()

    def callback(self, external_call, webhook_request):
        logger.info("Works Here!!!")
        response = json.loads(webhook_request.body)
        self.logger.info("Forced System Creation of {systemId} {result}".format(
            result=response['result'],
            systemId=external_call.callback_data['systemId'],
        ))
