import logging
from portal.views.base import BaseApiView
from portal.apps.users import utils as users_utils
from django.contrib.auth import get_user_model
from django.forms.models import model_to_dict
from django.http import HttpResponseNotFound, JsonResponse, HttpResponse
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.conf import settings
from elasticsearch_dsl import Q
from portal.libs.elasticsearch.docs.base import IndexedFile
from pytas.http import TASClient
from portal.apps.users.utils import get_allocations

logger = logging.getLogger(__name__)


class AuthenticatedView(BaseApiView):

    def get(self, request):
        if request.user.is_authenticated:
            u = request.user

            out = {
                "first_name": u.first_name,
                "username": u.username,
                "last_name": u.last_name,
                "email": u.email,
                "oauth": {
                    "expires_in": u.agave_oauth.expires_in,
                    "scope": u.agave_oauth.scope,
                },
                "isStaff": u.is_staff
            }

            return JsonResponse(out)
        return HttpResponse('Unauthorized', status=401)


@method_decorator(login_required, name='dispatch')
class UsageView(BaseApiView):

    def get(self, request):
        username = request.user.username
        system = settings.PORTAL_DATA_DEPOT_USER_SYSTEM_PREFIX.format(username)
        search = IndexedFile.search()
        # search = search.filter(Q({'nested': {'path': 'pems', 'query': {'term': {'pems.username': username} }} }))
        search = search.filter(Q('term', **{"system._exact": system}))
        search = search.extra(size=0)
        search.aggs.metric('total_storage_bytes', 'sum', field="length")
        resp = search.execute()
        resp = resp.to_dict()
        aggs = resp["aggregations"]["total_storage_bytes"]
        out = {}
        out["total_storage_bytes"] = aggs.get("value", 0.0)
        return JsonResponse(out, safe=False)


@method_decorator(login_required, name='dispatch')
class SearchView(BaseApiView):

    def get(self, request):
        resp_fields = ['first_name', 'last_name', 'email', 'username']

        model = get_user_model()
        q = request.GET.get('username')
        if q:
            try:
                user = model.objects.get(username=q)
            except ObjectDoesNotExist:
                return HttpResponseNotFound()
            res_dict = {
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'username': user.username,
            }
            try:
                user_tas = TASClient().get_user(username=q)
                res_dict['profile'] = {
                    'institution': user_tas['institution']
                }
            except Exception:
                logger.info('No Profile.')

            return JsonResponse(res_dict)

        q = request.GET.get('q')
        role = request.GET.get('role')
        user_rs = model.objects.filter()
        if q:
            query = users_utils.q_to_model_queries(q)
            if query is None:
                return JsonResponse({})

            user_rs = user_rs.filter(query)
        if role:
            logger.info(role)
            user_rs = user_rs.filter(groups__name=role)
        resp = [model_to_dict(u, fields=resp_fields) for u in user_rs]
        if len(resp):
            return JsonResponse(resp, safe=False)
        else:
            return HttpResponseNotFound()


@method_decorator(login_required, name='dispatch')
class AllocationsView(BaseApiView):

    def get(self, request):
        """Returns active user allocations on TACC resources

        : returns: {'allocs': allocations, 'portal_alloc': settings.PORTAL_ALLOCATION}
        : rtype: dict
        """
        allocations, inactive = get_allocations(request.user.username)

        return JsonResponse({'allocs': allocations, 'portal_alloc': settings.PORTAL_ALLOCATION, 'inactive': inactive}, safe=False)
