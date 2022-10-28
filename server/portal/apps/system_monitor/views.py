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
            'waiting': 0}


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
        print(systems_json)
        return JsonResponse(systems, safe=False)


class System:

    def __init__(self, system_dict):
        try:
            self.display_name = system_dict.get('display_name')
            self.tas_name = system_dict.get('tas_name')
            self.hostname = system_dict.get('hostname')


            self.waiting = system_dict.get('waiting')
            self.next_maintenance = system_dict.get('next_maintenance')
            self.load = system_dict.get('load')

            if isinstance(self.load, (float, int)):
                self.load = int((self.load * 100))
            else:
                self.load = None
            
            self.running = system_dict.get('running')
            self.waiting = system_dict.get('waiting')
            if 'system_type' in system_dict.get() == 'compute':
                self.resource_type = 'compute'
            else:
                self.resource_type = system_dict.get('storage')
            self.is_operational = self.is_up()
        except Exception as exc:
            logger.error(exc)

    def is_up(self):
        '''
        Checks each uptime metric to determine if the system is available
        '''
        self.running = self.get('running')
        if self.resource_type == 'compute':
            if not self.load: #or not self.jobs:
                return False
            if self.load > 99 and self.running < 1:
                return False
        self.online = self.get('online')
        self.reachable = self.get('reachable')
        self.queues_down = self.get('queues_down')
        self.in_maintenance = self.get('in_maintenance')
        if self.online & self.reachable & self.queues_down & (not self.in_maintenance): 
                return True
        else:
            return False
        # let's check each test:
        
        for st in self.status_tests:
            test = self.status_tests.get(st)
            if not test.get('status'):
                return False
            # now, let's check that the status has been updated recently
            if not self.status_updated_recently(last_updated=self.timestamp.get('timestamp')):
                return False
        return True

    def status_updated_recently(self, last_updated=None):
        '''
        Checks whether system availability metrics are being updated regularly
        '''
        if not last_updated:
            return False
        last_updated = dateutil.parser.parse(last_updated)
        current_time = datetime.now()
        # if we want to change the update interval, we can do it below
        expire_time = last_updated + timedelta(minutes=10)
        return pytz.utc.localize(current_time) < expire_time


    def to_dict(self):
        r = json.dumps(self.__dict__)
        return json.loads(r)
    

