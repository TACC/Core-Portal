
from portal.apps.workspace.models import (
    JobSubmission,
    AppTrayCategory,
    AppTrayEntry
)


def test_job_submission_model(django_db_reset_sequences, regular_user):
    event = JobSubmission.objects.create(
        user=regular_user,
        jobId="1234"
    )
    event = JobSubmission.objects.all()[0]
    assert event.user == regular_user
    assert event.jobId == "1234"


def test_app_tray_models(django_db_reset_sequences):
    category = AppTrayCategory.objects.create(
        category="test_category"
    )
    assert str(AppTrayCategory.objects.all()[0]) == "test_category"
    AppTrayEntry.objects.create(
        category=category,
        label="Matlab Latest",
        icon="matlab",
        version="0.0.1",
        appId="matlab",
        appType="tapis",
    )
    assert str(AppTrayEntry.objects.all()[0]) == "Matlab Latest: matlab-0.0.1"
    htmlApp = AppTrayEntry.objects.create(
        category=category,
        appType="html",
        label="Jupyter",
        appId="jupyterhub"
    )
    assert str(htmlApp) == "Jupyter: jupyterhub (HTML)"
