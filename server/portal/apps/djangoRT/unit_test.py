from mock import Mock, patch, MagicMock, PropertyMock
from rt import Rt
from django.test import TestCase, override_settings
from portal.apps.djangoRT.rtUtil import DjangoRt
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
            cc=[ "first@email.com", "second@email.com" ]
        )

    @override_settings(RT_TAG="Mock Tag")
    def test_createTicket(self):
        from django.conf import settings
        django_rt = DjangoRt()
        django_rt.createTicket(self.mock_ticket)
        django_rt.tracker.create_ticket.assert_called_with(
            Subject="Mock Subject",
            Text="Mock Description",
            Requestors="Mock Requestor",
            Cc="first@email.com,second@email.com",
            Queue=settings.RT_QUEUE,
            CF_resource="Mock Tag"
        )