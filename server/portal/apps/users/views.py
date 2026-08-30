import logging
import requests
import json
from zeep import Client
from zeep.transports import Transport
from zeep.cache import InMemoryCache
from zeep.exceptions import Fault

from portal.views.base import BaseApiView
from portal.apps.users import utils as users_utils
from django.contrib.auth import get_user_model
from django.forms.models import model_to_dict
from django.http import HttpResponseNotFound, HttpResponseBadRequest, JsonResponse
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.conf import settings
from elasticsearch_dsl import Q
from portal.libs.elasticsearch.docs.base import IndexedFile
from pytas.http import TASClient
from portal.apps.users.utils import (get_allocations, get_user_data, get_per_user_allocation_usage,
                                     add_user, remove_user, get_project_from_id, get_project_users_from_id)

logger = logging.getLogger(__name__)


class AuthenticatedView(BaseApiView):

    def get(self, request):
        if request.user.is_authenticated:
            u = request.user

            try:
                user = get_user_model().objects.get(username=u.username)
                groups = [group.name for group in user.groups.all()]
            except ObjectDoesNotExist:
                groups = []

            out = {
                "first_name": u.first_name,
                "username": u.username,
                "last_name": u.last_name,
                "email": u.email,
                "oauth": {
                    "expires_in": u.tapis_oauth.expires_in,
                },
                "isStaff": u.is_staff,
                "groups": groups
            }

            return JsonResponse(out)
        return JsonResponse({'message': 'Unauthorized'}, status=401)


@method_decorator(login_required, name='dispatch')
class UsageView(BaseApiView):

    def get(self, request, system_id):
        default_sys = settings.PORTAL_DATAFILES_DEFAULT_STORAGE_SYSTEM
        if not system_id and default_sys:
            system_id = default_sys['system']

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

        # Prevent endpoint from returning unfiltered user list.
        if not q and not role:
            return HttpResponseNotFound()

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

        # This line iterates through all the projects in the active allocations and filters out the ones that are excluded in settings.
        filtered_projects = [project for project in data["active"] if project.get("projectName") not in settings.ALLOCATIONS_TO_EXCLUDE]

        data["active"] = filtered_projects

        return JsonResponse({"response": data})


@method_decorator(login_required, name='dispatch')
class TeamView(BaseApiView):

    def get(self, request, project_id):
        """Returns usernames for project team

        : returns: {'usernames': usernames}
        : rtype: dict
        """
        usernames = get_project_users_from_id(project_id)

        return JsonResponse({'response': usernames}, safe=False)


@method_decorator(login_required, name='dispatch')
class UserDataView(BaseApiView):

    def get(self, request, username):
        user_data = get_user_data(username)
        return JsonResponse({username: user_data})


@method_decorator(login_required, name='dispatch')
class TasUsersView(BaseApiView):
    """SOAP actions for TAS"""

    def _getSOAPTASClient(self):
        """SOAP client via zeep
        """
        session = requests.Session()
        session.auth = requests.auth.HTTPBasicAuth(settings.TAS_CLIENT_KEY, settings.TAS_CLIENT_SECRET)

        try:
            client = Client("https://tas.tacc.utexas.edu/TASWebService/PortalService.asmx?WSDL",
                            transport=Transport(session=session, cache=InMemoryCache()))
        except Exception:
            raise Exception("Error instantiating TAS SOAP Client")
        return client

    def get(self, request):
        """SOAP search endpoint for TAS users
        """
        search_term = request.GET.get('search')
        if search_term is None:
            raise HttpResponseBadRequest('No search term provided')

        client = self._getSOAPTASClient()

        last_name_result = client.service.GetAccountsByLastName(search_term)
        email_result = client.service.GetAccountsByEmail(search_term)

        try:
            account_result = client.service.GetAccountByLogin(search_term)
        except Fault:
            account_result = None

        combined_results = []
        if last_name_result:
            combined_results.extend(last_name_result)
        if email_result:
            combined_results.extend(email_result)
        if account_result:
            combined_results.append(account_result)

        result = []
        for r in combined_results:
            entry = {"username": r.Login,
                     "email": r.Person.Email,
                     "firstName": r.Person.FirstName,
                     "lastName": r.Person.LastName}
            if entry not in result:
                result.append(entry)
        return JsonResponse({'result': result})

    def put(self, request):
        """SOAP endpoint to update TAS project user roles
        """
        body = json.loads(request.body)
        project_id = body.get('projectId', None)
        if project_id is None:
            return HttpResponseBadRequest('No project ID provided')
        user_role = body.get('role', None)
        if user_role is None:
            return HttpResponseBadRequest('No user role provided')
        user_id = body.get('userId', None)
        if user_id is None:
            return HttpResponseBadRequest('No user id provided')

        tas_project = get_project_from_id(project_id)
        project_name = tas_project['title']
        is_pi = tas_project['pi']['username'] == request.user.username
        if not is_pi:
            return JsonResponse({'message': 'Forbidden: Project roles can only be assigned by the Project PI.'}, status=403)

        tas_client = self._getSOAPTASClient()
        try:
            tas_client.service.EditProjectUser(user_id, user_role)
        except Exception:
            raise Exception(f"Error assigning user: {user_id} new role: {user_role} to project name:id : {project_name}:{project_id}")

        return JsonResponse({'response': 'ok'})


@method_decorator(login_required, name='dispatch')
class AllocationUsageView(BaseApiView):

    def get(self, request, allocation_id):
        usage = get_per_user_allocation_usage(allocation_id)
        return JsonResponse({'response': usage})


@method_decorator(login_required, name='dispatch')
class AllocationManagementView(BaseApiView):

    def post(self, request, project_id, user_id):
        logger.info('Adding {} to TAS project {}'.format(user_id, project_id))
        add_user(project_id, user_id)
        return JsonResponse({'response': 'ok'})

    def delete(self, request, project_id, user_id):
        logger.info('Deleting {} to TAS project {}'.format(user_id, project_id))
        remove_user(project_id, user_id)
        return JsonResponse({'response': 'ok'})
