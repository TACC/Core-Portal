from portal.apps.workspace.models import JobSubmission
from mock import MagicMock
from django.conf import settings
from portal.apps.workspace.api.views import JobsView
import json
import os
import pytest
from datetime import timedelta
from django.utils import timezone


pytest.mark.django_db(transaction=True)


@pytest.fixture
def get_user_data(mocker):
    mock = mocker.patch('portal.apps.accounts.managers.user_systems.get_user_data')
    with open(os.path.join(settings.BASE_DIR, 'fixtures/tas/tas_user.json')) as f:
        tas_user = json.load(f)
    mock.return_value = tas_user
    yield mock


@pytest.fixture
def apps_manager(mocker):
    yield mocker.patch(
        'portal.apps.workspace.api.views.UserApplicationsManager'
    )


@pytest.fixture
def test_job():
    with open(os.path.join(settings.BASE_DIR, 'fixtures', 'job-submission.json')) as f:
        yield json.load(f)


def test_job_post(rf, authenticated_user, get_user_data,
                  regular_user, mock_agave_client, apps_manager, test_job):
    mock_agave_client.jobs.submit.return_value = {"id": "1234"}
    view = JobsView()
    # Patch the User Applications Manager to return a fake cloned app
    mock_app = MagicMock()
    mock_app.id = "mock_app"
    mock_app.exec_sys = False
    apps_manager.return_value.get_or_create_app.return_value = mock_app

    # Send a job submission request
    request = rf.post(
        "/api/workspace/jobs",
        data=json.dumps(test_job),
        content_type="application/json"
    )
    request.user = authenticated_user
    view.post(request)

    # The job submission request
    job = JobSubmission.objects.all()[0]
    assert job.jobId == "1234"


def request_jobs_util(rf, authenticated_user, query_params={}):
    # Unit test helper function
    view = JobsView()
    request = rf.get("/api/workspace/jobs/", query_params)
    request.user = authenticated_user
    response = view.get(request)
    return json.loads(response.content)["response"]


def test_get_no_jobs(rf, authenticated_user, mock_agave_client):
    mock_agave_client.jobs.list.return_value = []
    jobs = request_jobs_util(rf, authenticated_user)
    assert len(jobs) == 0


def test_get_jobs_bad_offset(rf, authenticated_user, mock_agave_client):
    mock_agave_client.jobs.list.return_value = []
    jobs = request_jobs_util(rf, authenticated_user, query_params={"offset": 100})
    assert len(jobs) == 0


def test_date_filter(rf, authenticated_user, mock_agave_client):
    test_time = timezone.now()

    # today_job
    JobSubmission.objects.create(
        user=authenticated_user,
        jobId="9876"
    )
    JobSubmission.objects.filter(jobId="9876").update(time=test_time)

    # recent_job
    JobSubmission.objects.create(
        user=authenticated_user,
        jobId="1234",
    )
    JobSubmission.objects.filter(jobId="1234").update(time=test_time - timedelta(days=3))

    # older_job
    JobSubmission.objects.create(
        user=authenticated_user,
        jobId="2345",
    )
    JobSubmission.objects.filter(jobId="2345").update(time=test_time - timedelta(days=15))

    # oldest_job
    JobSubmission.objects.create(
        user=authenticated_user,
        jobId="3456",
    )
    JobSubmission.objects.filter(jobId="3456").update(time=test_time - timedelta(days=120))

    mock_agave_client.jobs.list.return_value = [
        {"id": "9876"},
        {"id": "1234"},
        {"id": "2345"},
        {"id": "3456"}
    ]

    # Test request for jobs with no period query param
    jobs = request_jobs_util(rf, authenticated_user)
    assert len(jobs) == 4

    # Test request for jobs with query for all jobs
    jobs = request_jobs_util(rf, authenticated_user, query_params={"period": "all"})
    assert len(jobs) == 4

    # Test request for jobs within one month
    jobs = request_jobs_util(rf, authenticated_user, query_params={"period": "month"})
    assert len(jobs) == 3

    # Test request for jobs within one week
    jobs = request_jobs_util(rf, authenticated_user, query_params={"period": "week"})
    assert len(jobs) == 2

    # Test request for jobs from today
    jobs = request_jobs_util(rf, authenticated_user, query_params={"period": "day"})
    assert len(jobs) == 1
