import logging
from portal.views.base import BaseApiView
from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied, ObjectDoesNotExist
from django.http import (
    Http404,
    JsonResponse,
    HttpResponseBadRequest,
)
from django.contrib.auth.decorators import login_required
from django.contrib.admin.views.decorators import staff_member_required
from django.utils.decorators import method_decorator
from django.conf import settings
from portal.apps.onboarding.models import (
    SetupEvent,
    SetupEventEncoder
)
from portal.apps.onboarding.execute import (
    log_setup_state,
    load_setup_step,
    execute_setup_steps
)
from portal.apps.onboarding.state import SetupState
from portal.apps.system_creation.utils import (
    force_create_storage_system
)
from portal.apps.users.utils import q_to_model_queries
import json

logger = logging.getLogger(__name__)


def get_user_onboarding(user):
    # Result dictionary for user
    result = {
        "username": user.username,
        "lastName": user.last_name,
        "firstName": user.first_name,
        "email": user.email,
        "isStaff": user.is_staff,
        "steps": [],
        "setupComplete": user.profile.setup_complete
    }

    # Populate steps list in result dictionary, in order of
    # steps as listed in PORTAL_USER_ACCOUNT_SETUP_STEPS
    account_setup_steps = getattr(settings, 'PORTAL_USER_ACCOUNT_SETUP_STEPS', [])
    for step in account_setup_steps:
        # Get step events in descending order of time
        step_events = SetupEvent.objects.all().filter(
            user=user, step=step['step']
        ).order_by('-time')

        step_instance = load_setup_step(user, step['step'])

        step_data = {
            "step": step['step'],
            "displayName": step_instance.display_name(),
            "description": step_instance.description(),
            "userConfirm": step_instance.user_confirm,
            "staffApprove": step_instance.staff_approve,
            "staffDeny": step_instance.staff_deny,
            "state": step_instance.state,
            "events": [event for event in step_events],
            "data": None
        }
        custom_status = step_instance.custom_status()
        if custom_status:
            step_data["customStatus"] = custom_status

        if step_instance.last_event:
            step_data["data"] = step_instance.last_event.data

        # Append all events. SetupEventEncoder will serialize
        # SetupEvent objects later
        result['steps'].append(step_data)

    return result


@method_decorator(login_required, name='dispatch')
class SetupStepView(BaseApiView):
    def get_user_parameter(self, request, username):
        """
        Validate request for action on a username

        Staff should be able to act on any user, but non-staff users
        should only be able to act on themselves.
        """
        # A user should only be able to retrieve info about themselves.
        # A staff member should be able to retrieve anyone.
        if username != request.user.username and not request.user.is_staff:
            raise PermissionDenied

        User = get_user_model()
        user = None
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise Http404

        return user

    def get(self, request, username=None):
        """
        View for returning a user's setup step events.

        Result structure will be:

        {
            ...
            user info
            ...
            "setupComplete" : true | false,
            "steps" : [
                {
                    "step" : "step1",
                    "state" : "pending",
                    "events" : [
                        SetupEvent, SetupEvent...
                    ]
                },
                ...
            ]
        }

        Where step dictionaries are in matching order of PORTAL_USER_ACCOUNT_SETUP_STEPS
        """
        if username is None:
            username = request.user.username

        user = self.get_user_parameter(request, username)

        result = get_user_onboarding(user)

        # Encode with SetupEventEncoder
        return JsonResponse(result, encoder=SetupEventEncoder)

    def complete(self, request, setup_step):
        """
        Move any step to COMPLETED
        """
        if not request.user.is_staff:
            raise PermissionDenied
        setup_step.state = SetupState.COMPLETED
        setup_step.log("{step} marked complete by {staff}".format(
            step=setup_step.display_name(),
            staff=request.user.username
        )
        )

    def reset(self, request, setup_step):
        """
        Call prepare() for the step. This should set it to its initial state.
        """
        if not request.user.is_staff:
            raise PermissionDenied
        setup_step.log("{step} reset by {staff}".format(
            step=setup_step.display_name(),
            staff=request.user.username
        )
        )

        # Mark the user's setup_complete as False
        setup_step.user.profile.setup_complete = False
        setup_step.user.profile.save()
        log_setup_state(
            setup_step.user,
            "{user} setup marked incomplete, due to reset of {step}".format(
                user=setup_step.user.username,
                step=setup_step.step_name()
            )
        )
        setup_step.prepare()

    def force_create_storage(self, request, setup_step):
        """
        Forces storage creation
        """
        if not request.user.is_staff:
            raise PermissionDenied
        setup_step.log("force_create_storage by {staff}, due to {step}".format(
            staff=request.user.username,
            step=setup_step.display_name()
        )
        )

        setup_step.user.profile.setup_complete = False
        setup_step.user.profile.save()

        log_setup_state(
            setup_step.user,
            "{user} setup marked complete, now will proceed to force storage system creation as {step}".format(
                user=setup_step.user.username,
                step=setup_step.step_name()
            )
        )

        force_create_storage_system(setup_step.user.username)

    def client_action(self, request, setup_step, action, data):
        """
        Call client_action on a setup step
        """
        setup_step.log("{action} action on {step} by {username}".format(
            action=action,
            step=setup_step.step_name(),
            username=request.user.username
        )
        )
        setup_step.client_action(action, data, request)

    def post(self, request, username):
        """
        Action handler for manipulating a user's setup step state.
        POST data from the client includes:

        {
            "action" : "staff_approve" | "staff_deny" | "user_confirm" |
                            "set_state" | "reset"
            "step" : SetupStep module and classname,
            "data" : an optional dictionary of data to send to the action
        }

        ..return: A JsonResponse with the last_event for the user's SetupStep,
                    reflecting state change
        """
        if username is None:
            username = request.user.username

        # Get the user object requested in the route parameter
        user = self.get_user_parameter(request, username)

        # Get POST action data
        step_name = None
        action = None
        data = None

        try:
            request_data = json.loads(request.body)
            step_name = request_data["step"]
            action = request_data["action"]
            if "data" in request_data:
                data = request_data["data"]
        except Exception:
            return HttpResponseBadRequest()

        # Instantiate the step instance requested by the POST, from the SetupEvent model.
        setup_step = load_setup_step(user, step_name)

        # Call action handler
        if action == "reset":
            self.reset(request, setup_step)
            execute_setup_steps.apply_async(args=[user.username])
        elif action == "force_create_storage":
            self.force_create_storage(request, setup_step)
        elif action == "complete":
            self.complete(request, setup_step)
            execute_setup_steps.apply_async(args=[user.username])
        else:
            self.client_action(request, setup_step, action, data)
            execute_setup_steps.apply_async(args=[user.username])

        # If no exception was generated from any of the above actions, continue.
        # Retry executing the setup queue for this user

        # Serialize and send back the last event on this step
        # Requires safe=False since SetupEvent is not a dict
        return JsonResponse(
            setup_step.last_event,
            encoder=SetupEventEncoder,
            safe=False
        )


@method_decorator(login_required, name='dispatch')
@method_decorator(staff_member_required, name='dispatch')
class SetupAdminView(BaseApiView):
    def get(self, request):
        offset = int(request.GET.get('offset', 0))
        limit = int(request.GET.get('limit', 10))
        users = []
        results = get_user_model().objects.all()
        q = request.GET.get('q', None)
        if q:
            query = q_to_model_queries(q)
            results = results.filter(query)
        # Get users, with users that do not have setup_complete, first
        results = results.order_by('profile__setup_complete', 'last_name', 'first_name')
        # Uncomment this line to simulate many user results
        # results = list(results) * 105
        total = len(results)
        page = results[offset:offset + limit]

        # Assemble an array with the User data we care about
        for user in page:
            try:
                users.append(get_user_onboarding(user))
            except ObjectDoesNotExist as err:
                # If a user does not have a PortalProfile, skip it
                logger.info(err)

        response = {
            "users": users,
            "offset": offset,
            "limit": limit,
            "total": total
        }

        return JsonResponse(
            response,
            encoder=SetupEventEncoder,
            safe=False
        )
