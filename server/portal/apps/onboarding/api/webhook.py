from portal.apps.onboarding.execute import (
    load_setup_step, 
    execute_setup_steps
)
from portal.apps.accounts.models import PortalProfile
from portal.apps.onboarding.models import (
    SetupEvent, 
    SetupEventEncoder
)
from portal.apps.onboarding.state import SetupState
from portal.views.base import BaseApiView
from django.contrib.auth import get_user_model
from django.utils.decorators import method_decorator
from django.http import (
    JsonResponse, 
    HttpResponse,
    HttpResponseBadRequest,
    HttpResponseForbidden
)
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import json
import logging
import base64
import traceback

logger = logging.getLogger(__name__)

class SetupStepWebhookView(BaseApiView):
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super(SetupStepWebhookView, self).dispatch(*args, **kwargs)

    @csrf_exempt
    def post(self, request, *args, **kwargs):
        """Webhook callback for Setup Steps

        A webhook POST must have the following headers:

        content-type="application/json"
        HTTP_AUTHORIZATION

        Args:

            request body (dict): Dictionary containing the webhook data.
            {
                "username" : username to set step state,
                "step" : full package name of step
                "webhook_data" : (optional) a json dictionary to be passed
                                    to the setup step's webhook method
            }

        """
        try:
            # Webhook must have HTTP_AUTHORIZATION header with password
            auth_header = request.META['HTTP_AUTHORIZATION']
            encoded_credentials = auth_header.split(' ')[1]
            decoded_credentials = base64.b64decode(encoded_credentials).decode('utf-8').split(':')
            password = decoded_credentials[1]
            if password != settings.PORTAL_USER_ACCOUNT_SETUP_WEBHOOK_PWD:
                raise Exception("Bad password for setup webhook")

        except Exception as ex:
            logger.info("Webhook authorization failed")
            logger.info(ex)
            return HttpResponseForbidden()
        
        # Get request body
        setup = json.loads(request.body)

        logger.debug("Setup Webhook Post")
        logger.debug(setup)

        try:
            username = setup['username']
            step = setup['step']

            # Set default webhook_data to None
            webhook_data = None

            # webhook_data is optional
            if 'webhook_data' in setup:
                webhook_data = setup['webhook_data']

            User = get_user_model()
            user = User.objects.get(username=username)

            # Get the setup step for the user
            setup_step = load_setup_step(user, step)

            # Verify that the setup_step is in the WEBHOOK
            # state. Otherwise, it should not be expecting
            # a webhook!
            if setup_step.state != SetupState.WEBHOOK:
                raise Exception(
                    "{step} for {username} is in {state} state - expected WEBHOOK state".format(
                        step=step,
                        username=user.username,
                        state=setup_step.state
                    )
                )

            setup_step.webhook_callback(webhook_data)

            # If no exception was generated from any of the above actions, continue.
            # Retry executing the setup queue for this user
            execute_setup_steps.apply_async(args=[username])

            # Serialize and send back the last event on this step
            # Requires safe=False since SetupEvent is not a dict
            return HttpResponse("OK")

        except Exception as ex:
            logger.info("Exception occurred during webhook")
            logger.info(ex)
            traceback.print_exc()

            return HttpResponseBadRequest()