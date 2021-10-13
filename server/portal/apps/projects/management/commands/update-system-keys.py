"""Management command."""

from django.core.management.base import BaseCommand
from django.conf import settings
from requests.exceptions import HTTPError
from portal.libs.agave.models.systems.storage import StorageSystem
from datetime import datetime
from portal.libs.agave.utils import service_account


class Command(BaseCommand):

    def handle(self, *args, **options):
        """Handle command."""

        def test_system(client, systemId):
            try:
                client.files.list(
                    systemId=systemId,
                    filePath=''
                )
                print('{} is good'.format(systemId))
            except HTTPError as err:
                result = err.response.json()
                print(result)
                print('Test failed for {}'.format(systemId))

                with open('test-failed.txt', 'a+') as f:
                    f.write(systemId + '\n')

        def update_system(client, system):
            # system.storage.port = 2222
            # system.storage.host = 'cloud.corral.tacc.utexas.edu'
            system.storage.auth.username = "wma_prtl"
            system.storage.auth.type = "SSHKEYS"
            system.storage.auth.private_key = (
                settings.PORTAL_PROJECTS_PRIVATE_KEY
            )
            system.storage.auth.public_key = (
                settings.PORTAL_PROJECTS_PUBLIC_KEY
            )
            try:
                system.update()
                print("{} updated".format(system.id))

                test_system(client, system.id)

            except Exception as e:
                print(e)
                print("could not update {}".format(system.id))

                with open('update-failed.txt', 'a+') as f:
                    f.write(system.id + '\n')

        def update_systems(client, systemFile):
            for line in systemFile:
                systemId = line.strip()
                system = StorageSystem(
                    client,
                    id=systemId,
                )

                if not system.available:
                    with open('disabled.txt', 'a+') as f:
                        f.write(systemId + '\n')
                    continue

                if system.lastModified.today().date() == datetime.today().date():
                    test_system(client, system.id)
                else:
                    update_system(client, system)

        with open('portals-MatchedKeys.txt', 'r') as systemFile:
            update_systems(service_account(), systemFile)
