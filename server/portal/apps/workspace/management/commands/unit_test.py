from mock import patch
import pytest
from django.test import TransactionTestCase
from django.contrib.auth import get_user_model
from django.core.management import call_command
from portal.apps.workspace.models import JobSubmission


@pytest.mark.django_db(transaction=True)
class TestImportJobs(TransactionTestCase):
    fixtures = ['users']

    def setUp(self):
        self.mock_client_patcher = patch('portal.apps.workspace.management.commands.import-jobs.service_account')
        self.mock_client = self.mock_client_patcher.start()
        self.user = get_user_model().objects.get(username="username")

    def tearDown(self):
        self.mock_client_patcher.stop()

    @patch('portal.apps.workspace.management.commands.import-jobs.get_user_model')
    def test_import(self, mock_user_model):
        mock_user_model.return_value.objects.all.return_value = [self.user]
        JobSubmission.objects.create(
            jobId="1234",
            user=self.user
        )
        self.mock_client.return_value.jobs.list.return_value = [
            {
                "id": "1234",
                "created": "2019-10-29T18:30:13Z"
            },
            {
                "id": "5678",
                "created": "2019-10-29T19:30:13Z"
            }
        ]

        call_command('import-jobs')

        result = JobSubmission.objects.all().filter(user=self.user)
        self.assertEqual(len(result), 2)
