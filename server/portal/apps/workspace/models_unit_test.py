
from portal.apps.workspace.models import (
    JobSubmission,
    AppTrayCategory,
    AppTrayEntry
)


# NOTE: Don't need for v3
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
    category.save()
    assert str(AppTrayCategory.objects.all()[0]) == "test_category"
    app = AppTrayEntry.objects.create(
        category=category,
        name="matlab",
        label="Matlab Latest",
        appType="agave",
        icon="matlab",
        version="latest",
        revision="latest"
    )
    app.save()
    assert str(AppTrayEntry.objects.all()[0]) == "Matlab Latest: matlab-latestulatest"
    htmlApp = AppTrayEntry.objects.create(
        category=category,
        appType="html",
        label="Jupyter",
        htmlId="jupyterhub"
    )
    assert str(htmlApp) == "Jupyter: jupyterhub (HTML)"
