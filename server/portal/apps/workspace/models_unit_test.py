
from portal.apps.workspace.models import JobSubmission
from django.contrib.auth import get_user_model
from django.test import TestCase
import pytest


@pytest.mark.django_db(transaction=True)
class TestJobSubmissionModel(TestCase):
    def setUp(self):
        super(TestJobSubmissionModel, self).setUp()
        # Create a test user
        self.user = get_user_model().objects.create_user("test", "test", "test")

    def tearDown(self):
        super(TestJobSubmissionModel, self).tearDown()

    def test_model(self):
        event = JobSubmission.objects.create(
            user=self.user,
            jobId="1234"
        )
        event = JobSubmission.objects.all()[0]
        self.assertEqual(event.user, self.user)
        self.assertEqual(event.jobId, "1234")
