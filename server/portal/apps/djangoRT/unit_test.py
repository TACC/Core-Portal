from rt import Rt
import os
import time
from django.test import TestCase, override_settings
from mock import Mock, patch, MagicMock, PropertyMock, ANY
from django.test import Client
from django.test.client import RequestFactory
from django.contrib.auth.models import User
from portal.apps.djangoRT.views import ticketcreate
from portal.apps.djangoRT import views
from portal.apps.djangoRT.rtUtil import DjangoRt
from portal.apps.djangoRT.forms import TicketForm
from portal.apps.djangoRT.rtModels import Ticket
from django.contrib.auth import get_user_model
import random

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

'''
Testing that user tickets are parsed and rendered
'''
class TestGetUserTickets(TestCase):
    fixtures = ['users', 'auth']
    @patch('portal.apps.djangoRT.rtUtil.rt.Rt')
    def test_get_user_tickets(self, rt_class):
        self.search_statuses = []
        self.ticket_id = 2500
        def rt_search_patch(Queue=[], Requestors__exact='', Status__exact='status', order='-LastUpdated'):
            self.search_statuses.append(Status__exact)
            return [{'id': 'ticket/' + str(self.ticket_id),
                    'numerical_id': self.ticket_id, 'Subject': 'Ticket with status: '\
                    + Status__exact,'LastUpdated': 'Fri Apr 19 11:09:29 2019'}]

        rt_class.return_value.login.return_value = True
        rt_class.return_value.search.side_effect = rt_search_patch

        user = get_user_model().objects.get(username="username")
        self.client.force_login(user)
        resp = self.client.get('/tickets/', follow=True)
        self.assertTrue(resp.status_code == 200)
        content = resp.content.decode('utf-8')

        '''
        Checking that ticket counts are correct on render
        '''
        self.assertIn('Open (1)', content)
        self.assertIn('New (1)', content)
        self.assertIn('Response Required (1)', content)
        self.assertIn('Resolved (2)', content) # includes tickets marked resolved and closed

        for status in self.search_statuses:
            render_text = '<a href="/tickets/ticket/' + str(self.ticket_id) + '/"> #'\
                    + str(self.ticket_id) + ' : Ticket with status: ' + status + '</a>'
            self.assertTrue(render_text in content, 'Did not find render text: ' + render_text)

'''
Testing that user gets redirected correctly after creating a ticket
'''
class TestCreateTicketAndRedirect(TestCase):
    fixtures = ['users', 'auth']
    @patch('portal.apps.djangoRT.rtUtil.rt.Rt')
    def test_create_ticket_and_redirect(self, rt_class):
        self.ticket_id = '42'

        rt_class.return_value.login.return_value = True
        rt_class.return_value.create_ticket.return_value = self.ticket_id

        post_data = {
            'first_name': 'First Name', 
            'last_name': 'Last Name', 
            'email': 'test@test.com',
            'cc': 'test2@test.com',
            'subject': 'Mock Subject',
            'problem_description' : "Mock Description",
            'metadata': 'fake_data'
        }

        user = get_user_model().objects.get(username="username")
        self.client.force_login(user)
        resp = self.client.post('/tickets/ticket/new/', post_data, follow=False,
            HTTP_USER_AGENT='Mozilla/5.0', HTTP_REFERER='test referrer', SERVER_NAME='test.test')
        expected_redirect = '/tickets/ticket/%s/' % (self.ticket_id)
        self.assertRedirects(resp, expected_redirect, status_code=302, msg_prefix='', fetch_redirect_response=False)