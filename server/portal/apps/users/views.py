import logging
import json
import requests
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
from portal.apps.users.utils import get_allocations, get_usernames, get_user_data, get_per_user_allocation_usage

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
        return JsonResponse({'message': 'Unauthorized'}, status=401)


@method_decorator(login_required, name='dispatch')
class UsageView(BaseApiView):

    def get(self, request, system_id):
        username = request.user.username

        if not system_id:
            # get default system prefix
            default_sys = settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEM_DEFAULT
            default_system_prefix = settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEMS[default_sys]['prefix']
            system_id = default_system_prefix.format(username)

        search = IndexedFile.search()
        # search = search.filter(Q({'nested': {'path': 'pems', 'query': {'term': {'pems.username': username} }} }))
        search = search.filter(Q('term', **{"system._exact": system_id}))
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

        : returns: {'response': {'active': allocations, 'portal_alloc': settings.PORTAL_ALLOCATION, 'inactive': inactive, 'hosts': hosts}}
        : rtype: dict
        """
        data = get_allocations(request.user.username)

        return JsonResponse({"response": data})


@method_decorator(login_required, name='dispatch')
class TeamView(BaseApiView):

    def get(self, request, project_name):
        """Returns usernames for project team

        : returns: {'usernames': usernames}
        : rtype: dict
        """
        usernames = get_usernames(project_name)
        return JsonResponse({'response': usernames}, safe=False)

    def post(self, request, project_name):
        body = json.loads(request.body)
        user_to_add = body['username']
        logger.debug("Adding user {} from project {}".format(user_to_add, project_name))

        auth = requests.auth.HTTPBasicAuth(settings.TAS_CLIENT_KEY, settings.TAS_CLIENT_SECRET)
        r = requests.post('{0}/v1/projects/{1}/users/{2}'.format(settings.TAS_URL, project_name, user_to_add), auth=auth)
        resp = r.json()
        logger.debug(resp)
        if resp['status'] == 'success':
            return JsonResponse({'response': resp['result'], 'message': "Add {}".format(user_to_add)})
        else:
            return JsonResponse({'response': resp['result'], 'message': "Unable to add {}".format(user_to_add), 'status': 401})

    def delete(self, request, project_name):

        body = json.loads(request.body)
        user_to_delete = body['username']
        logger.debug("Deleting user {} from project {}".format(user_to_delete, project_name))

        auth = requests.auth.HTTPBasicAuth(settings.TAS_CLIENT_KEY, settings.TAS_CLIENT_SECRET)
        r = requests.delete('{0}/v1/projects/{1}/users/{2}'.format(settings.TAS_URL, project_name, user_to_delete), auth=auth)
        resp = r.json()
        logger.debug(resp)
        if resp['status'] == 'success':
            return JsonResponse({'response': resp['result'], 'message': "Deleted {}".format(user_to_delete)})
        else:
            return JsonResponse({'response': resp['result'], 'message': "Unable to delete {}".format(user_to_delete), 'status': 401})



@method_decorator(login_required, name='dispatch')
class UserDataView(BaseApiView):

    def get(self, request, username):
        user_data = get_user_data(username)
        return JsonResponse({username: user_data})

@method_decorator(login_required, name='dispatch')
class SearchUserView(BaseApiView):
    def get(self, request):
        field = request.GET.get('field')
        q = request.GET.get('q')
        logger.debug(field)
        logger.debug(q)
        tup_url = 'https://portal.tacc.utexas.edu/projects-and-allocations/-/pm/api'
        r = requests.get('{}/users?action=search&field={}&term={}'.format(tup_url, field, q))
        resp = r.json()
        logger.debug(resp)
        return JsonResponse({'response': resp['result']})


@method_decorator(login_required, name='dispatch')
class AllocationUsageView(BaseApiView):

    def get(self, request, allocation_id):
        usage = get_per_user_allocation_usage(allocation_id)
        return JsonResponse({'response': usage})
