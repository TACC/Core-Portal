from django.conf import settings
from portal.views.base import BaseApiView
from django.http import JsonResponse
import requests
import json
import logging

logger = logging.getLogger(__name__)


def _get_unoperational_system(display_name):
    return {'display_name': display_name,
            'is_operational': False,
            'load': 0,
            'running': 0,
            'waiting': 0,
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
            self.resource_type = 'compute'
            self.running = system_dict.get('running')
            self.waiting = system_dict.get('waiting')
            self.load = system_dict.get('load')
            if isinstance(self.load, (float, int)):
                self.load = int((self.load * 100))
            else:
                self.load = 0
            self.online = system_dict.get('online')
            self.reachable = system_dict.get('reachable')
            self.queues_down = system_dict.get('queues_down')
            self.in_maintenance = system_dict.get('in_maintenance')
            self.is_operational = self.is_up()
        except Exception as exc:
            logger.error(exc)

    def is_up(self):
        if self.resource_type == 'compute':
            if (not self.online) or (not self.reachable) or self.queues_down or self.in_maintenance:
                return False
            else:
                return True

    def to_dict(self):
        r = json.dumps(self.__dict__)
        return json.loads(r)
