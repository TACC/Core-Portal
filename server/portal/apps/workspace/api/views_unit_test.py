from mock import MagicMock
from django.conf import settings
from portal.apps.workspace.api.views import JobsView, AppsTrayView
from portal.apps.workspace.models import AppTrayCategory
from portal.apps.workspace.models import JobSubmission
import json
import os
import pytest
from tapipy.tapis import TapisResult
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


@pytest.mark.skip(reason="job post not implemented yet")
def test_job_post(client, authenticated_user, get_user_data, mock_tapis_client,
                  apps_manager, job_submmission_definition):
    mock_tapis_client.jobs.resubmitJob.return_value = {"uuid": "1234"}

    response = client.post(
        "/api/workspace/jobs",
        data=json.dumps(job_submmission_definition),
        content_type="application/json"
    )
    assert response.status_code == 200
    assert response.json() == {"response": {"uuid": "1234"}}


def test_job_post_cancel(client, authenticated_user, get_user_data, mock_tapis_client,
                         apps_manager, job_submmission_definition):
    mock_tapis_client.jobs.cancelJob.return_value = {"uuid": "1234"}

    response = client.post(
        "/api/workspace/jobs",
        data=json.dumps({"action": "cancel", "job_uuid": "1234"}),
        content_type="application/json"
    )
    assert response.status_code == 200
    assert response.json() == {"status": 200, "response": {"uuid": "1234"}}


def test_job_post_resubmit(client, authenticated_user, get_user_data, mock_tapis_client,
                           apps_manager, job_submmission_definition):
    mock_tapis_client.jobs.resubmitJob.return_value = {"uuid": "1234"}

    response = client.post(
        "/api/workspace/jobs",
        data=json.dumps({"action": "resubmit", "job_uuid": "1234"}),
        content_type="application/json"
    )
    assert response.status_code == 200
    assert response.json() == {"status": 200, "response": {"uuid": "1234"}}


def test_job_post_invalid(client, authenticated_user, get_user_data, mock_tapis_client,
                          apps_manager, job_submmission_definition):
    response = client.post(
        "/api/workspace/jobs",
        data=json.dumps({"action": "invalid action", "job_uuid": "1234"}),
        content_type="application/json"
    )
    assert response.status_code == 400
    assert response.json() == {"message": "user:username is trying to run an unsupported job action: invalid action for job uuid: 1234"}


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
    mock_tapis_client.jobs.getJobSearchList.return_value = []
    jobs = request_jobs_util(rf, authenticated_user)
    assert len(jobs) == 0


def test_get_no_portal_jobs(rf, authenticated_user, mock_tapis_client):
    JobSubmission.objects.create(
        user=authenticated_user,
        jobId="9876"
    )
    mock_tapis_client.jobs.getJobSearchList.return_value = []
    jobs = request_jobs_util(rf, authenticated_user)
    assert len(jobs) == 0


def test_get_jobs_bad_offset(rf, authenticated_user, mock_tapis_client):
    mock_tapis_client.jobs.getJobSearchList.return_value = []
    jobs = request_jobs_util(rf, authenticated_user, query_params={"offset": 100})
    assert len(jobs) == 0


def test_tray_get_private_apps(authenticated_user, mock_tapis_client, mocker):
    view = AppsTrayView()
    app = TapisResult(**{
        'id': 'myapp-0.1',
        'version': '0.1',
        'notes': {
            'label': 'Matlab'
        }
    })
    mock_tapis_client.apps.getApps.return_value = [app]
    expected_list = [
        {
            "label": app.notes.label,
            "version": app.version,
            "type": "tapis",
            "appId": app.id,
        }
    ]
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
