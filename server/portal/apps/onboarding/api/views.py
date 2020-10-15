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
import json

logger = logging.getLogger(__name__)


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

    def get(self, request, username):
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
        user = self.get_user_parameter(request, username)
        account_setup_steps = getattr(settings, 'PORTAL_USER_ACCOUNT_SETUP_STEPS', [])

        # Result dictionary for user
        result = {
            "username": username,
            "lastName": user.last_name,
            "firstName": user.first_name,
            "email": user.email,
            "isStaff": user.is_staff,
            "steps": [],
            "setupComplete": user.profile.setup_complete
        }

        # Populate steps list in result dictionary, in order of
        # steps as listed in PORTAL_USER_ACCOUNT_SETUP_STEPS
        for step in account_setup_steps:
            # Get step events in descending order of time
            step_events = SetupEvent.objects.all().filter(
                user=user, step=step
            ).order_by('-time')

            step_instance = load_setup_step(user, step)

            step_data = {
                "step": step,
                "displayName": step_instance.display_name(),
                "state": step_instance.state,
                "events": [event for event in step_events],
                "data": None
            }

            if step_instance.last_event:
                step_data["data"] = step_instance.last_event.data

            # Append all events. SetupEventEncoder will serialize
            # SetupEvent objects later
            result['steps'].append(step_data)

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
                            "set_state" | "reset" | "webhook_send",
            "step" : SetupStep module and classname,
            "data" : an optional dictionary of data to send to the action
        }

        ..return: A JsonResponse with the last_event for the user's SetupStep,
                    reflecting state change
        """
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
        elif action == "complete":
            self.complete(request, setup_step)
        else:
            self.client_action(request, setup_step, action, data)

        # If no exception was generated from any of the above actions, continue.
        # Retry executing the setup queue for this user
        execute_setup_steps.apply_async(args=[user.username])

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
    def create_user_result(self, user):
        user_result = {}
        user_result['username'] = user.username
        user_result['lastName'] = user.last_name
        user_result['firstName'] = user.first_name
        user_result['dateJoined'] = user.date_joined
        user_result['email'] = user.email
        user_result['setupComplete'] = user.profile.setup_complete

        try:
            last_event = SetupEvent.objects.all().filter(
                user=user
            ).latest('time')
            user_result['lastEvent'] = last_event
        except SetupEvent.DoesNotExist:
            pass

        return user_result

    def get(self, request):
        users = []
        model = get_user_model()
        # Get users, with users that do not have setup_complete, first
        result = model.objects.all().order_by('profile__setup_complete', 'last_name', 'first_name')

        # Assemble an array with the User data we care about
        for user in result:
            try:
                users.append(self.create_user_result(user))
            except ObjectDoesNotExist as err:
                # If a user does not have a PortalProfile, skip it
                logger.info(err)

        response = {
            "users": users
        }

        return JsonResponse(
            response,
            encoder=SetupEventEncoder,
            safe=False
        )
