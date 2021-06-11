"""Management command."""

from django.conf import settings
from django.core.management.base import BaseCommand
from portal.libs.agave.utils import service_account
from portal.libs.agave.models.files import BaseFile
from portal.apps.projects.models.base import ProjectId, Project
from portal.apps.webhooks.callback import WebhookCallback
from portal.apps.system_creation.utils import call_reactor, substitute_user_variables
from portal.libs.agave.utils import service_account
from django.contrib.auth import get_user_model
import logging
import json


class Command(BaseCommand):
    """Command class."""

    help = (
        'Rewrite the host of a /work storage system to cloud.corral'
    )
    def add_arguments(self, parser):
        parser.add_argument('-s', '--system', type=str, required=True, help="System name")

    def handle(self, *args, **options):
        """Handle command."""
        systemId = options.get('system')
        
        agc = service_account()
        system = agc.systems.get(systemId=systemId)
        username = system['storage']['rootDir'].split('/')[-1]
        user, _ = get_user_model().objects.get_or_create(username=username)

        variables = {
            'name': system['name'],
            'systemId': systemId,
            'host': 'cloud.corral.tacc.utexas.edu',
            'description': system['description'],
            'site': system['site'],
            'rootDir': '/work/{tasdir}',
            'port': 2222,
        }
        _, variables = substitute_user_variables(user, system['name'], variables)

        result = call_reactor(
            user,
            systemId,
            'wma-storage',
            variables,
            force=True,
            dryrun=False,
            callback="portal.apps.system_creation.management.commands.cloud_corral.CloudCorralCallback",
            callback_data={
                "systemId": systemId,
                "originalHost": system['storage']['host']
            }
        )
        print(
            "KeyService creation reactor for {} has executionId {}".format(
                systemId,
                result['executionId']
            )
        )


class CloudCorralCallback(WebhookCallback):
    logger = logging.getLogger(__name__)

    def __init__(self):
        super(CloudCorralCallback, self).__init__()

    def callback(self, external_call, webhook_request):
        response = json.loads(webhook_request.body)
        self.logger.info("Rewrite System {systemId} {result}, original host: {originalHost}".format(
            result=response['result'],
            systemId=external_call.callback_data['systemId'],
            originalHost=external_call.callback_data['originalHost']
        ))
