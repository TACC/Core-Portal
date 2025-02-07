from django.conf import settings
from portal.apps.workspace.api.views import JobsView, AppsTrayView, AppsView
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
    mock = mocker.patch("portal.apps.workspace.api.views.get_user_data")
    with open(os.path.join(settings.BASE_DIR, "fixtures/tas/tas_user.json")) as f:
        tas_user = json.load(f)
    mock.return_value = tas_user
    yield mock


@pytest.fixture
def job_submmission_definition():
    with open(os.path.join(settings.BASE_DIR, "fixtures", "job-submission.json")) as f:
        yield json.load(f)


@pytest.fixture
def logging_metric_mock(mocker):
    yield mocker.patch("portal.apps.workspace.api.views.logging.Logger.info")


@pytest.fixture
def tapis_apps_list():
    apps = []
    with open(os.path.join(settings.BASE_DIR, "fixtures/app-tray.json")) as f:
        app_tray_data = json.load(f)

        for entry in app_tray_data:
            if (
                entry.get("model") == "workspace.apptrayentry"
                and entry["fields"]["appType"] == "tapis"
            ):
                app = TapisResult(
                    **{
                        "id": entry["fields"]["appId"],
                        "version": entry["fields"]["version"],
                    }
                )
                apps.append(app)

    yield apps


@pytest.fixture
def tapis_get_systems_list():
    system_list = []
    with open(
        os.path.join(settings.BASE_DIR, "fixtures/tapis/systems/listing.json")
    ) as f:
        systems = json.load(f)
        for entry in systems:
            system_list.append(TapisResult(**entry))

    yield system_list


@pytest.mark.skip(reason="job post not implemented yet")
def test_job_post(
    client,
    authenticated_user,
    get_user_data,
    mock_tapis_client,
    job_submmission_definition,
):
    mock_tapis_client.jobs.resubmitJob.return_value = TapisResult(
        **{
            "uuid": "1234",
        }
    )

    response = client.post(
        "/api/workspace/jobs",
        data=json.dumps(job_submmission_definition),
        content_type="application/json",
    )
    assert response.status_code == 200
    assert response.json() == {"response": {"uuid": "1234"}}


def test_job_post_cancel(
    client,
    authenticated_user,
    get_user_data,
    mock_tapis_client,
    job_submmission_definition,
):
    mock_tapis_client.jobs.cancelJob.return_value = TapisResult(
        **{
            "uuid": "1234",
        }
    )

    response = client.post(
        "/api/workspace/jobs",
        data=json.dumps({"action": "cancel", "job_uuid": "1234"}),
        content_type="application/json",
    )
    assert response.status_code == 200
    assert response.json() == {"status": 200, "response": {"uuid": "1234"}}


def test_job_post_resubmit(
    client,
    authenticated_user,
    get_user_data,
    mock_tapis_client,
    job_submmission_definition,
):
    mock_tapis_client.jobs.resubmitJob.return_value = TapisResult(
        **{
            "uuid": "1234",
        }
    )

    response = client.post(
        "/api/workspace/jobs",
        data=json.dumps({"action": "resubmit", "job_uuid": "1234"}),
        content_type="application/json",
    )
    assert response.status_code == 200
    assert response.json() == {"status": 200, "response": {"uuid": "1234"}}


def test_job_post_invalid(
    client,
    authenticated_user,
    get_user_data,
    mock_tapis_client,
    job_submmission_definition,
):
    response = client.post(
        "/api/workspace/jobs",
        data=json.dumps({"action": "invalid action", "job_uuid": "1234"}),
        content_type="application/json",
    )
    assert response.status_code == 400
    assert response.json() == {
        "message": "user:username is trying to run an unsupported job action: invalid action for job uuid: 1234"
    }


def test_job_post_is_logged_for_metrics(
    client,
    authenticated_user,
    get_user_data,
    mock_tapis_client,
    job_submmission_definition,
    logging_metric_mock,
):
    mock_tapis_client.jobs.submitJob.return_value = {"id": "1234"}
    mock_tapis_client.files.listFiles.return_value = {"path": ""}

    client.post(
        "/api/workspace/jobs",
        data=json.dumps(job_submmission_definition),
        content_type="application/json",
    )

    tapis_job_submission = {
        **job_submmission_definition["job"],
        "archiveSystemId": "cloud.data",
        "archiveSystemDir": "HOST_EVAL($HOME)/tapis-jobs-archive/${JobCreateDate}/${JobName}-${JobUUID}",
        "tags": ["portalName: test"],
        "subscriptions": [
            {
                "description": "Portal job status notification",
                "enabled": True,
                "eventCategoryFilter": "JOB_NEW_STATUS",
                "ttlMinutes": 0,
                "deliveryTargets": [
                    {
                        "deliveryMethod": "WEBHOOK",
                        "deliveryAddress": "http://testserver/webhooks/jobs/",
                    }
                ],
            }
        ],
    }

    # Ensure metric-related logging is being performed
    logging_metric_mock.assert_called_with(
        "user:{} is submitting job:{}".format(
            authenticated_user.username, tapis_job_submission
        )
    )


def request_jobs_util(client, authenticated_user, query_params={}):
    # Unit test helper function
    view = JobsView()
    request = client.get("/api/workspace/jobs/", query_params)
    request.user = authenticated_user
    operation = "listing"
    response = view.get(request, operation)
    return json.loads(response.content)["response"]


def test_get_no_tapis_jobs(client, authenticated_user, mock_tapis_client):
    mock_tapis_client.jobs.getJobSearchList.return_value = []
    jobs = request_jobs_util(client, authenticated_user)
    assert len(jobs) == 0


def test_get_no_portal_jobs(client, authenticated_user, mock_tapis_client):
    JobSubmission.objects.create(user=authenticated_user, jobId="9876")
    mock_tapis_client.jobs.getJobSearchList.return_value = []
    jobs = request_jobs_util(client, authenticated_user)
    assert len(jobs) == 0


def test_get_jobs_bad_offset(client, authenticated_user, mock_tapis_client):
    mock_tapis_client.jobs.getJobSearchList.return_value = []
    jobs = request_jobs_util(client, authenticated_user, query_params={"offset": 100})
    assert len(jobs) == 0


def test_tray_get_private_apps(authenticated_user, mock_tapis_client, mocker):
    view = AppsTrayView()
    app = TapisResult(
        **{"id": "myapp-0.1", "version": "0.1", "notes": {"label": "Matlab"}}
    )
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
def test_tray_get_public_apps(
    django_db_blocker, mock_tapis_client, authenticated_user, tapis_apps_list
):
    # Load fixtures
    with django_db_blocker.unblock():
        call_command("loaddata", "app-tray.json")
    # Assert that fixtures were loaded
    assert len(AppTrayCategory.objects.all()) == 3
    # Mock tapis getApps call to return the tapis apps
    mock_tapis_client.apps.getApps.return_value = tapis_apps_list
    # Execute api and assert
    view = AppsTrayView()
    categories, html_definitions = view.getPublicApps(authenticated_user)
    assert len(categories) == 3
    assert categories[0]["title"] == "Simulation"
    assert len(categories[0]["apps"]) == 1
    assert categories[1]["title"] == "Data Processing"
    assert len(categories[1]["apps"]) == 3
    assert categories[2]["title"] == "Visualization"
    assert len(categories[2]["apps"]) == 1
    assert len(html_definitions) == 1


def test_get_app_unauthenticated(client):
    response = client.get("/api/workspace/apps/")
    assert response.status_code == 302  # redirect to login


@pytest.mark.django_db(transaction=True)
@pytest.mark.parametrize("dynamic_exec_system", [True, False])
def test_get_app_dynamic_exec_sys(
    dynamic_exec_system,
    django_db_blocker,
    mock_tapis_client,
    authenticated_user,
    client,
    tapis_get_systems_list,
):
    # Load fixtures
    with django_db_blocker.unblock():
        call_command("loaddata", "app-tray.json")

    with open(os.path.join(settings.BASE_DIR, "fixtures/tapis/apps/hello-world-app-def.json")) as f:
        app = json.load(f)
        if dynamic_exec_system:
            app["notes"]["dynamicExecSystems"] = ["frontera", "ls6"]

    # setup tapis mocks
    mock_tapis_client.apps.getApp.return_value = TapisResult(**app)
    if dynamic_exec_system:
        mock_tapis_client.systems.getSystems.return_value = tapis_get_systems_list
    else:
        mock_tapis_client.systems.getSystem.return_value = tapis_get_systems_list[1]
    # invoke and assert
    apps_view = AppsView()
    query_params = {"appId": "hello-world", "appVersion": "0.0.1"}
    request = client.get("/api/workspace/apps/", query_params)
    request.user = authenticated_user
    response = apps_view.get(request)
    assert response.status_code == 200
    response_json = json.loads(response.content)["response"]
    assert response_json["definition"]["id"] == "hello-world"
    assert response_json["definition"]["version"] == "0.0.1"
    if dynamic_exec_system:
        assert len(response_json["execSystems"]) == 2
        mock_tapis_client.systems.getSystems.assert_called_with(listType='ALL', select='allAttributes',
                                                                search='(id.in.frontera,ls6)~(canExec.eq.true)~(enabled.eq.true)')
    else:
        assert len(response_json["execSystems"]) == 1
        assert response_json["execSystems"][0]["id"] == "frontera"
