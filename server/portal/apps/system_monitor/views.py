from django.conf import settings
from portal.views.base import BaseApiView
from django.http import JsonResponse
import requests
import json
import logging

logger = logging.getLogger(__name__)


def _get_unoperational_system(display_name):
    return {'display_name': display_name,
            'hostname': display_name.lower() + '.tacc.utexas.edu',
            'is_operational': False,
            'load_percentage': 0,
            'jobs': {'running': 0, 'queued': 0},
            }


class SysmonDataView(BaseApiView):

    def get(self, request):
        '''
            Pulls and parses data from TACC User Portal then populates and returns a list of Systems objects
        '''
        systems = []
        requested_systems = settings.SYSTEM_MONITOR_DISPLAY_LIST
        systems_json = requests.get(settings.SYSTEM_MONITOR_URL).json()
        for sys in requested_systems:
            if sys not in systems_json:
                logger.info('System information for {} is missing. Assuming not operational status.'.format(sys))
                systems.append(_get_unoperational_system(sys))
                continue
            try:
                system = System(systems_json[sys]).to_dict()
                systems.append(system)
            except Exception:
                logger.exception('Problem gather system information for {}: Assuming not operational status'.format(sys))
                systems.append(_get_unoperational_system(sys))
        return JsonResponse(systems, safe=False)


class System:

    def __init__(self, system_dict):
        try:
            self.display_name = system_dict.get('display_name')
            self.hostname = system_dict.get('hostname')
            self.resource_type = system_dict.get("system_type")
            self.load_percentage = system_dict.get('load')
            if isinstance(self.load_percentage, (float, int)):
                self.load_percentage = int(self.load_percentage * 100)
            else:
                self.load_percentage = 0
            self.jobs = {
                'running': system_dict.get('running'),
                'queued': system_dict.get('waiting'),
            }
            self.online = system_dict.get('online')
            self.reachable = system_dict.get('reachable')
            self.queues_down = system_dict.get('queues_down')
            self.in_maintenance = system_dict.get('in_maintenance')
            self.is_operational = self.is_up()
        except Exception as exc:
            logger.error(exc)

    def is_up(self):
        return self.online and self.reachable and not (self.queues_down or self.in_maintenance)

    def to_dict(self):
        r = json.dumps(self.__dict__)
        return json.loads(r)
