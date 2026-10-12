import json
import logging
import math

import requests
from django.conf import settings
from django.http import JsonResponse

from portal.views.base import BaseApiView

logger = logging.getLogger(__name__)


def _get_unoperational_system(display_name):
    return {
        "display_name": display_name,
        "hostname": display_name.lower() + ".tacc.utexas.edu",
        "is_operational": False,
        "load_percentage": 0,
        "jobs": {"running": 0, "queued": 0},
    }


class SysmonDataView(BaseApiView):
    def get(self, request, system_name=None):
        """
        Pulls and parses data from TACC User Portal then populates and returns a list of Systems objects
        """

        if system_name:
            system_json = requests.get(f"{settings.SYSTEM_MONITOR_URL}{system_name}").json()

            requested_systems = settings.SYSTEM_MONITOR_DISPLAY_LIST

            if system_json["display_name"] in requested_systems:
                return JsonResponse(_get_queues(system_json), safe=False)
        else:
            systems = []
            requested_systems = settings.SYSTEM_MONITOR_DISPLAY_LIST
            systems_json = requests.get(settings.SYSTEM_MONITOR_URL).json()
            for sys in requested_systems:
                if sys not in systems_json:
                    logger.info(f"System information for {sys} is missing. Assuming not operational status.")
                    systems.append(_get_unoperational_system(sys))
                    continue
                try:
                    system = System(systems_json[sys]).to_dict()
                    systems.append(system)
                except Exception:
                    logger.exception(f"Problem gather system information for {sys}: Assuming not operational status")
                    systems.append(_get_unoperational_system(sys))
            return JsonResponse(systems, safe=False)


def _get_queues(system_dict):
    """Expose queue loads as finite numbers or null for unavailable values."""
    queues = system_dict.get("queues")
    if not isinstance(queues, dict):
        return []
    result = []
    for name, data in queues.items():
        if not isinstance(data, dict):
            continue
        load = data.get("load")
        if isinstance(load, bool) or not isinstance(load, (int, float)) or not math.isfinite(load):
            load = None
        result.append({**data, "name": name, "load": load})
    return result


class System:
    def __init__(self, system_dict):
        try:
            self.display_name = system_dict.get("display_name")
            self.hostname = system_dict.get("hostname")
            self.resource_type = system_dict.get("system_type")
            self.load_percentage = system_dict.get("load")
            if isinstance(self.load_percentage, (float, int)):
                self.load_percentage = int(self.load_percentage * 100)
            else:
                self.load_percentage = 0
            self.jobs = {
                "running": system_dict.get("running"),
                "queued": system_dict.get("waiting"),
            }
            self.online = system_dict.get("online")
            self.reachable = system_dict.get("reachable")
            self.queues_down = system_dict.get("queues_down")
            self.in_maintenance = system_dict.get("in_maintenance")
            self.is_operational = self.is_up()
        except Exception as exc:
            logger.error(exc)

    def is_up(self):
        return self.online and self.reachable and not (self.queues_down or self.in_maintenance)

    def to_dict(self):
        r = json.dumps(self.__dict__)
        return json.loads(r)
