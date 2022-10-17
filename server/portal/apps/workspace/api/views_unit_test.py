from mock import MagicMock
from django.conf import settings
from portal.apps.workspace.api.views import JobsView, AppsTrayView
from portal.apps.workspace.models import AppTrayCategory
from portal.apps.workspace.models import JobSubmission
import json
import os
import pytest
import copy
from datetime import timedelta
from django.utils import timezone
from django.core.management import call_command


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
    mock_apps_manager = mocker.patch(
        'portal.apps.workspace.api.views.UserApplicationsManager'
    )
    # Patch the User Applications Manager to return a fake cloned app
    mock_app = MagicMock()
    mock_app.id = "mock_app"
    mock_app.exec_sys = False
    mock_apps_manager.return_value.get_or_create_app.return_value = mock_app
    yield mock_apps_manager


@pytest.fixture
def job_submmission_definition():
    with open(os.path.join(settings.BASE_DIR, 'fixtures', 'job-submission.json')) as f:
        yield json.load(f)


@pytest.fixture
def logging_metric_mock(mocker):
    yield mocker.patch('portal.apps.workspace.api.views.logging.Logger.info')


def test_job_post(client, authenticated_user, get_user_data, mock_tapis_client,
                  apps_manager, job_submmission_definition):
    mock_tapis_client.jobs.submit.return_value = {"id": "1234"}

    response = client.post(
        "/api/workspace/jobs",
        data=json.dumps(job_submmission_definition),
        content_type="application/json"
    )
    assert response.status_code == 200
    assert response.json() == {"response": {"id": "1234"}}

    # The job submission request
    job = JobSubmission.objects.all()[0]
    assert job.jobId == "1234"


def test_job_post_is_logged_for_metrics(client, authenticated_user, get_user_data, mock_tapis_client,
                                        apps_manager, job_submmission_definition, logging_metric_mock):
    mock_tapis_client.jobs.submit.return_value = {"id": "1234"}

    client.post(
        "/api/workspace/jobs",
        data=json.dumps(job_submmission_definition),
        content_type="application/json"
    )
    # Ensure metric-related logging is being performed
    logging_metric_mock.assert_called_with("user:{} is submitting job:{}".format(authenticated_user.username,
                                                                                 job_submmission_definition))


def request_jobs_util(rf, authenticated_user, query_params={}):
    # Unit test helper function
    view = JobsView()
    request = rf.get("/api/workspace/jobs/", query_params)
    request.user = authenticated_user
    response = view.get(request)
    return json.loads(response.content)["response"]


def test_get_no_tapis_jobs(rf, authenticated_user, mock_tapis_client):
    mock_tapis_client.jobs.list.return_value = []
    jobs = request_jobs_util(rf, authenticated_user)
    assert len(jobs) == 0


def test_get_no_portal_jobs(rf, authenticated_user, mock_tapis_client):
    JobSubmission.objects.create(
        user=authenticated_user,
        jobId="9876"
    )
    mock_tapis_client.jobs.list.return_value = [
    ]
    jobs = request_jobs_util(rf, authenticated_user)
    assert len(jobs) == 0


def test_get_jobs_bad_offset(rf, authenticated_user, mock_tapis_client):
    mock_tapis_client.jobs.list.return_value = []
    jobs = request_jobs_util(rf, authenticated_user, query_params={"offset": 100})
    assert len(jobs) == 0


def test_date_filter(rf, authenticated_user, mock_tapis_client):
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

    mock_tapis_client.jobs.list.return_value = [
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


def test_tray_get_appid_by_spec(authenticated_user, mock_tapis_client):
    compress_01u1 = {
        'id': 'compress-0.1u1',
        'name': 'compress',
        'version': '0.1',
        'revision': '1'
    }
    compress_01u2 = {
        'id': 'compress-0.1u2',
        'name': 'compress',
        'version': '0.1',
        'revision': '2'
    }
    compress_02u1 = {
        'id': 'compress-0.2u1',
        'name': 'compress',
        'version': '0.2',
        'revision': 1
    }
    view = AppsTrayView()
    mock_tapis_client.apps.list.return_value = [compress_01u1, compress_01u2]
    assert view.getAppIdBySpec(
        MagicMock(name='compress', version='0.1'), authenticated_user) == 'compress-0.1u2'
    mock_tapis_client.apps.list.return_value = [compress_01u2, compress_02u1]
    assert view.getAppIdBySpec(
        MagicMock(name='compress', version='0.1'), authenticated_user) == 'compress-0.2u1'


@pytest.mark.skip(reason="Tray endpoint and related tests need to be updated")
def test_tray_get_app(mocker, client, authenticated_user):
    mock_get_by_spec = mocker.patch.object(AppsTrayView, 'getAppIdBySpec')
    mock_get_app = mocker.patch('portal.apps.workspace.api.views._get_app')
    view = AppsTrayView()

    # Try retrieving an app spec without a specific appId
    mock_spec = MagicMock(
        name='compress', version='0.1', appId=None, lastRetrieved='compress-0.1u1'
    )
    mock_get_by_spec.return_value = 'compress-0.1u1'
    view.getApp(mock_spec, authenticated_user)
    mock_get_app.assert_called_with('compress-0.1u1', authenticated_user)

    # Try retrieving a specific app ID and see that the lastRetrieved field is updated
    mock_spec.appId = 'compress-0.2u1'
    view.getApp(mock_spec, authenticated_user)
    assert mock_spec.lastRetrieved == 'compress-0.2u1'
    mock_get_app.assert_called_with('compress-0.2u1', authenticated_user)


def test_tray_get_private_apps(authenticated_user, mock_tapis_client, mocker):
    view = AppsTrayView()
    mock_get_app = mocker.patch('portal.apps.workspace.api.views._get_app')
    app = {
        'id': 'myapp-0.1',
        'label': 'My App',
        'version': '0.1',
        'revision': '1',
        'shortDescription': 'My App',
    }
    mock_tapis_client.apps.list.return_value = [
        {
            'id': 'prtl.clone.hidden'
        },
        app
    ]
    mock_get_app.return_value = app
    expected_list = [copy.deepcopy(app)]
    expected_list[0]['type'] = 'agave'
    expected_list[0]['appId'] = 'myapp-0.1'
    expected_list[0].pop('id', None)
    assert view.getPrivateApps(authenticated_user) == expected_list


@pytest.mark.django_db(transaction=True)
@pytest.mark.skip(reason="Tray endpoint and related tests need to be updated")
def test_tray_get_public_apps(django_db_setup, django_db_blocker, mocker,
                              mock_tapis_client, authenticated_user):
    # Load fixtures
    with django_db_blocker.unblock():
        call_command('loaddata', 'app-tray.json')
    # Assert that fixtures were loaded
    assert len(AppTrayCategory.objects.all()) == 3
    mocker.patch.object(AppsTrayView, 'getApp')
    view = AppsTrayView()
    categories, definitions = view.getPublicApps(authenticated_user)
    assert len(categories) == 3
    assert categories[0]['title'] == 'Simulation'
    assert len(categories[0]['apps']) == 1


def test_get_app_unauthenticated(client):
    response = client.get('/api/workspace/apps/')
    assert response.status_code == 302  # redirect to login
