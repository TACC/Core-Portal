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
            'load_percentage': 0,
            'jobs': {'running': 0, 'queued': 0, 'other': 0},
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
            self.tas_name = system_dict.get('tas_name')
            self.hostname = system_dict.get('hostname')
            self.waiting = system_dict.get('waiting')
            self.online = system_dict.get('online')
            self.reachable = system_dict.get('reachable')
            self.
            if 'ssh' in system_dict.keys():
                self.ssh = system_dict.get('ssh')
            if 'heartbeat' in system_dict.keys():
                self.heartbeat = system_dict.get('heartbeat')
            if 'tests' in system_dict.keys():
                self.status_tests = system_dict.get('tests')
            if 'system_type' in system_dict.keys() == 'compute':
                self.resource_type = 'compute'
                self.load_percentage = system_dict.get('load')
                self.running = system_dict.get('running')
                self.waiting = system_dict.get('waiting')
                if isinstance(self.load_percentage, (float, int)):
                    self.load_percentage = int((self.load_percentage * 100))
                else:
                    self.load_percentage = None
            else:
                self.resource_type = 'storage'
        except Exception as exc:
            logger.error(exc)

    def is_up(self):
        '''
        Checks each uptime metric to determine if the system is available
        '''
        if self.resource_type == 'compute':
            if not self.load_percentage: #or not self.jobs:
                return False
            if self.load_percentage > 99 and self.running.get('running', 0) < 1:
                return False
        # let's check each test:
        for st in self.reachable:
            test = self.status_tests.get(st)
            if not test.get('status'):
                return False
            # now, let's check that the status has been updated recently
            if not self.status_updated_recently(last_updated=self.get('timestamp')):
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
