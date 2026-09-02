import logging
import os
from django.views.static import serve
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, JsonResponse, Http404

logger = logging.getLogger(__name__)


def project_version(request):
    try:
        with open('.git/HEAD') as f:
            head = f.readline()

        if 'ref:' in head:
            # we're on a branch
            branch = head.split(':')[1].strip()
            with open('.git/{0}'.format(branch)) as f:
                version = '{}:{}'.format(branch, f.readline())
        else:
            # we're in a detached head, e.g., a tag. would be nice to show tag name...
            version = head

    except IOError:
        logger.warning('Unable to read project version from git HEAD')
        version = 'UNKNOWN'

    return HttpResponse(version, content_type='text/plain')


def health_check(request):
    health_status = {'status': 'healthy'}
    return JsonResponse(health_status)


@login_required
def serve_docs(request, path):
    file_path = os.path.join(settings.INTERNAL_DOCS_ROOT, path)
    if os.path.isdir(file_path):
        # For mkdocs directories, append index.html
        index_file = os.path.join(file_path, 'index.html')
        if os.path.isfile(index_file):
            path = os.path.join(path, 'index.html')
        else:
            raise Http404("Directory index not found")

    return serve(request, path, document_root=settings.INTERNAL_DOCS_ROOT)
