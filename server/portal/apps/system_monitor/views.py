from random import SystemRandom
from django.conf import settings
from datetime import datetime, timedelta
from portal.views.base import BaseApiView
from django.http import JsonResponse
import dateutil.parser
import requests
import json
import logging
import pytz

logger = logging.getLogger(__name__)


def _get_unoperational_system(hostname):
    return {'hostname': hostname,
            'display_name': hostname.split('.')[0].capitalize(),
            'is_operational': False,
            'load': 0,
            'running': 0, 
            'waiting': 0,
            'other': 0}


class SysmonDataView(BaseApiView):

    def get(self, request):
        '''
            Pulls and parses data from TACC User Portal then populates and returns a list of Systems objects
        '''
        systems = []
        requested_systems = settings.SYSTEM_MONITOR_DISPLAY_LIST
        systems_json = requests.get(settings.NEW_SYSTEM_MONITOR_URL).json()
        print(requested_systems)
        print(systems_json)
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
            self.cpu_count = None
            self.cpu_used = None
            self.display_name = system_dict.get('display_name')
            self.hostname = system_dict.get('hostname')
            self.ssh = { 'status': None, 'timestamp': system_dict.get('timestamp'), "type": None }
            self.heartbeat = { 'status': None, 'timestamp': system_dict.get('timestamp'), "type": None }
            self.status_tests = None
            self.resource_type = 'compute'
            self.jobs = {'other': None, 'running': system_dict.get('running'),
                         'queued': system_dict.get('waiting')}
            self.load_percentage = system_dict.get('load')
            if isinstance(self.load_percentage, (float, int)):
                self.load_percentage = int((self.load_percentage * 100))
            else:
                self.load_percentage = None
            self.online = system_dict.get('online')
            self.reachable = system_dict.get('reachable')
            self.queues_down = system_dict.get('queues_down')
            self.in_maintenance = system_dict.get('in_maintenance')
            self.next_maintenance = system_dict.get('next_maintenance')
            self.is_operational = self.is_up()
        except Exception as exc:
            logger.error(exc)

    def is_up(self):
        if self.online and self.reachable and (not self.queues_down) and (not self.in_maintenance): 
                return True
        else:
            return False


    def to_dict(self):
        r = json.dumps(self.__dict__)
        return json.loads(r)
    

