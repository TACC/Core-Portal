import json
import logging

from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

logger = logging.getLogger("csp_reports")


# @csrf_exempt
# @require_POST
# def csp_report(request):
#     try:
#         payload = json.loads(request.body.decode("utf-8"))
#     except (ValueError, UnicodeDecodeError):
#         # Malformed report body — log raw bytes for debugging, don't 500
#         logger.warning("Malformed CSP report body: %r", request.body[:500])
#         return HttpResponse(status=204)

#     # Browsers send either the older `csp-report` wrapper or newer
#     # Reporting API format depending on report-uri vs report-to
#     report = payload.get("csp-report", payload)

#     logger.warning("CSP violation: %s", json.dumps(report))

#     return HttpResponse(status=204)
