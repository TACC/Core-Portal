from portal.apps.onboarding.steps.abstract import AbstractStep
from portal.apps.onboarding.state import SetupState
from django.conf import settings
from portal.apps.users.utils import get_allocations
from pytas.http import TASClient
import string

class AllocationStep(AbstractStep):
    pi_eligible_message = """
        <p>
            Thank you for using TACC. Prior to accessing this portal, it will require an
            allocation on the HPC resources. To get an allocation, you will need to perform 
            one of the following:
        </p>
        <ul>
            <li>
                Create a research project and a resource allocation request. Once the allocation request 
                is approved and active you will be granted access to the requested resource.
            </li>
            <li>
                Have another PI add you to their research project which has an active allocation.
            </li>
        </ul>
        <p>
            Please visit:
        </p>
        <ul>
            <li>
                <a href="https://portal.tacc.utexas.edu/allocations-overview" target="_blank">
                    https://portal.tacc.utexas.edu/allocations-overview
                </a>
                <a href="https://portal.tacc.utexas.edu/tutorials/managing-allocations" target="_blank">
                    https://portal.tacc.utexas.edu/tutorials/managing-allocations
                </a>
            </li>
        </ul>
        <a class="btn btn-primary" 
           href="/tickets/ticket/new?subject=Requesting an Allocation">
           Submit a Ticket
        </a>
    """

    pi_ineligible_message = """
        <p>
            Thank you for using TACC. In order to access this portal, it will require an allocation
            on the HPC resources. Please have your PI or advisor add your username to a project 
            that has an active HPC allocation.
        </p>
        <p>
            Please visit:
        </p>
        <ul>
            <li>
                <a href="https://portal.tacc.utexas.edu/new-user-information" target="_blank">
                    https://portal.tacc.utexas.edu/new-user-information
                </a>
            </li>
        </ul>
         <a class="btn btn-primary" 
           href="/tickets/ticket/new?subject=Requesting an Allocation">
           Submit a Ticket
        </a>
    """

    def __init__(self, user):
        """
        Call super class constructor
        """
        super(AllocationStep, self).__init__(user)

    def display_name(self):
        return "Checking Allocations"

    def prepare(self):
        self.state = SetupState.PENDING
        self.log("Awaiting allocation check")
        
    def process(self):
        # Get "ALLOCATION_SYSTEMS" setting
        # This setting should be a list that specifies which
        # systems fulfill the requirement. A user should have at least
        # one of these systems.

        # TODO: This should be stored in proposed LiveSettings
        systems = getattr(settings, 'ALLOCATION_SYSTEMS', [])

        # If the setting does not exist, we will assume that
        # no systems are required and their allocation check is verified
        if len(systems) == 0:
            self.complete("No systems are required for access to this portal")
            return

        resources = [ ]
        try:
            resources = get_allocations(self.user.username).keys()
        except:
            self.state = SetupState.ERROR
            self.log("Unable to retrieve a list of projects")
            return

        # If the intersection of the set of systems and resources has items,
        # the user has the necessary allocation
        has_alloc = len(set(systems).intersection(resources)) > 0

        if has_alloc:
            self.complete("You have the required systems for accessing this portal")
        else:
            tas_client = TASClient(
                baseURL=settings.TAS_URL,
                credentials={
                    'username': settings.TAS_CLIENT_KEY,
                    'password': settings.TAS_CLIENT_SECRET
                }
            )
            tas_user = tas_client.get_user(username=self.user.username)
            if tas_user['piEligibility'] == 'Eligible':
                message = self.pi_eligible_message
            else:
                message = self.pi_ineligible_message

            self.state = SetupState.USERWAIT
            self.log(
                "Verify that you have a project allocation with one of the required systems for this portal, then click the Confirm button.",
                data={
                    "more_info": message
                }
            )
    
    def client_action(self, action, data, request):
        if action == "user_confirm" and request.user.username == self.user.username:
            self.prepare()