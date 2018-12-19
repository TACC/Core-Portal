from rt import Rt
import os
from django.test import TestCase, override_settings
from mock import Mock, patch, MagicMock, PropertyMock, ANY
from django.test.client import RequestFactory
from django.contrib.auth.models import User
from portal.apps.djangoRT.views import ticketcreate
from portal.apps.djangoRT.rtUtil import DjangoRt
from portal.apps.djangoRT.forms import TicketForm
from portal.apps.djangoRT.rtModels import Ticket

class TestDataDepotApiViews(TestCase):
    @classmethod
    def setUpClass(cls):
        cls.mock_rt_patcher = patch('portal.apps.djangoRT.rtUtil.rt')
        cls.mock_rt = cls.mock_rt_patcher.start()
        cls.mock_rt.Rt.return_value = MagicMock(spec=Rt)

    @classmethod
    def tearDownClass(cls):
        cls.mock_rt_patcher.stop()

    def setUp(self):
        self.mock_ticket = Ticket(
            subject="Mock Subject", 
            problem_description="Mock Description",
            requestor="Mock Requestor",
            cc=[ "first@email.com", "second@email.com" ],
            attachments = []
        )

    @override_settings(RT_TAG="Mock Tag")
    def test_createTicket(self):
        from django.conf import settings
        django_rt = DjangoRt()
        django_rt.createTicket(self.mock_ticket)
        django_rt.tracker.create_ticket.assert_called_with(
            files = [],
            Subject="Mock Subject",
            Text="Mock Description",
            Requestors="Mock Requestor",
            Cc="first@email.com,second@email.com",
            Queue=settings.RT_QUEUE,
            CF_resource="Mock Tag"
        )


class TestTicketMetadata(TestCase):
    @classmethod
    def setUpClass(cls):
        # Mock rtUtil
        cls.mock_rtUtil_patcher = patch('portal.apps.djangoRT.views.rtUtil')
        cls.mock_rtUtil = cls.mock_rtUtil_patcher.start()

        # Mock call to render -- we are not testing to see if it renders output correctly
        # and this would fail pipeline since base.html is not built from template yet
        cls.mock_render_patcher = patch('portal.apps.djangoRT.views.render')
        cls.mock_render = cls.mock_render_patcher.start()

        cls.mock_forms_patcher = patch('portal.apps.djangoRT.views.forms')
        cls.mock_forms = cls.mock_forms_patcher.start()

        # Test metadata info
        cls.metadata_fixture = '*** Ticket Metadata ***' + os.linesep + os.linesep + \
            'Client info:' + os.linesep + \
            'Mock Client Info' + os.linesep + os.linesep + \
            'HTTP_REFERER' + os.linesep + \
            'None' + os.linesep + os.linesep + \
            'HTTP_USER_AGENT' + os.linesep +  \
            'None' + os.linesep + os.linesep + \
            'HTTP_COOKIE' + os.linesep + \
            'None' + os.linesep +  os.linesep + \
            'SERVER_NAME' + os.linesep + \
            'testserver' + os.linesep + os.linesep

    @classmethod
    def tearDownClass(cls):
        cls.mock_render_patcher.stop()
        cls.mock_rtUtil_patcher.stop()
        cls.mock_forms_patcher.stop()

    def test_ticketcreate_get_view(self):

        # Create a mocked user for a GET request
        mock_user = MagicMock(spec=User)
        mock_user.username = "mock"
        mock_user.email="mock@user.com"
        mock_user.first_name = "Mock"
        mock_user.last_name = "Requestor"

        # Create a GET request with request_vars, cookie and mocked user
        rf = RequestFactory()
        get_request = rf.get('/tickets/ticket/new', {
            'subject' : "Mock Subject", 
            'info' : "Mock Client Info"}
        )
        get_request.user = mock_user
        get_request.META['HTTP_COOKIE'] = 'None'


        # Test ticketcreate and make sure it creates a form with
        # pre-filled subject and a hidden metadata field
        ticketcreate(get_request)
        self.mock_forms.TicketForm.assert_called_with(initial={
            'first_name': mock_user.first_name, 
            'last_name': mock_user.last_name, 
            'email': mock_user.email, 
            'subject': 'Mock Subject',
            'metadata' : self.metadata_fixture
        })

    def test_ticketcreate_post_view(self):
        # Since we want to test DjangoRt.createTicket, create a specific MagicMock instance
        self.mock_rtUtil.DjangoRt.return_value = MagicMock(spec=DjangoRt)

        # You cannot DjangoRt.createTicket.assert_called_with to check an object parameter
        # since it only asserts instance ID equivalence.
        # Therefore, to test the Ticket object to see if metadata was inserted as a field, 
        # we will use an assertion as a side_effect of the mocked DjangoRt.createTicket
        def test_ticket_metadata(ticket):
            assert self.metadata_fixture in ticket.problem_description 

        self.mock_rtUtil.DjangoRt.return_value.createTicket.side_effect=test_ticket_metadata
        
        # Create a test form POST
        rf = RequestFactory()
        post_request_data = {
            'subject' : "Mock Subject",
            'problem_description' : "Mock Description",
            'email' : "user@mock.com",
            'cc' : "first@email.com,second@email.com",
            'metadata' : self.metadata_fixture
        }
        post_request = rf.post('/tickets/ticket/new', post_request_data)
        post_request.user = MagicMock(spec=User)
 
        # Mock the cleaned_data array from the Form
        self.mock_forms.TicketForm.return_value.cleaned_data = post_request_data
        self.mock_forms.TicketForm.return_value.cleaned_data['cc'] = [ "first@email.com", "second@email.com" ]
        
        # Run client code
        ticketcreate(post_request)

        # Sanity check - if the mocked createTicket was never called then no side_effect would 
        # have ever been generated
        self.mock_rtUtil.DjangoRt.return_value.createTicket.assert_called_with(ANY)
