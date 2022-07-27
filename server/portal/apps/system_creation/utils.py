from portal.apps.webhooks.utils import register_webhook
from portal.libs.agave.utils import service_account
from django.conf import settings
import logging
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


def substitute_user_variables(user, systemId, variables, additional_substitutions={}):
    """
    Utility function to substitute systemId and variables with user specific
    values, such as {username}, {workdir}
    """
    substitutions = _create_substitutions(user)
    merged_substitutions = {**substitutions, **additional_substitutions}
    systemId = systemId.format(**merged_substitutions)
    variables = _substitute_variables(variables, merged_substitutions)
    return systemId, variables


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
