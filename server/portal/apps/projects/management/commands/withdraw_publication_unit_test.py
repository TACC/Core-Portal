from io import StringIO

import pytest
from django.core.management import CommandError, call_command

from portal.apps.projects.workspace_operations.datacite_operations import DataCiteError
from portal.apps.publications.models import Publication

DIR = "portal.apps.projects.management.commands.withdraw_publication"

pytestmark = pytest.mark.django_db


@pytest.fixture(autouse=True)
def not_debug(settings):
    settings.DEBUG = False


@pytest.fixture
def publications():
    Publication.objects.create(project_id="test.project-1", version=2, value={"doi": "10.12345/aaaa"}, tree={})
    Publication.objects.create(project_id="test.project-2", version=1, value={}, tree={})
    Publication.objects.create(
        project_id="test.project-9", version=1, value={"doi": "10.12345/zzzz"}, tree={}, is_published=False
    )


@pytest.fixture
def mock_hide(mocker):
    return mocker.patch(f"{DIR}.hide_datacite_doi", return_value={"data": {}})


@pytest.fixture
def mock_publish(mocker):
    return mocker.patch(f"{DIR}.publish_datacite_doi", return_value={"data": {}})


# What publish_publication_doi would send with the `publish` event: the live version's metadata.
LIVE_METADATA = {"titles": [{"title": "Live version"}], "url": "https://example.org/live"}


@pytest.fixture(autouse=True)
def mock_doi_update(mocker):
    return mocker.patch(f"{DIR}.get_publish_doi_update", return_value=(None, LIVE_METADATA))


def run(*args):
    out, err = StringIO(), StringIO()
    call_command("withdraw_publication", *args, stdout=out, stderr=err)
    return out.getvalue(), err.getvalue()


def is_published(project_id):
    return Publication.objects.get(project_id=project_id).is_published


def test_requires_a_project_id():
    with pytest.raises(CommandError, match="project_ids"):
        run()


def test_unknown_id_is_an_error_and_nothing_is_withdrawn(publications, mock_hide):
    with pytest.raises(CommandError, match="No publication found for: test.project-404"):
        run("test.project-1", "test.project-404")

    assert is_published("test.project-1")
    mock_hide.assert_not_called()


def test_withdraws_and_hides_doi(publications, mock_hide):
    out, _ = run("test.project-1")

    assert not is_published("test.project-1")
    mock_hide.assert_called_once_with("10.12345/aaaa")
    assert "Withdrew test.project-1 v2" in out
    assert "Hid 10.12345/aaaa (test.project-1 v2)" in out
    assert is_published("test.project-2")


def test_publication_without_doi_is_withdrawn_without_hiding(publications, mock_hide):
    out, _ = run("test.project-2")

    assert not is_published("test.project-2")
    mock_hide.assert_not_called()
    assert "Skipped DataCite hide for test.project-2 v1: no DOI" in out


def test_already_withdrawn_publication_retries_the_hide(publications, mock_hide):
    out, _ = run("test.project-9")

    mock_hide.assert_called_once_with("10.12345/zzzz")
    assert "test.project-9 v1 was already withdrawn" in out
    assert "Hid 10.12345/zzzz (test.project-9 v1)" in out


def test_debug_skips_hiding(publications, mock_hide, settings):
    settings.DEBUG = True

    out, _ = run("test.project-1")

    assert not is_published("test.project-1")
    mock_hide.assert_not_called()
    assert "Skipped DataCite hide for 10.12345/aaaa (test.project-1 v2): DEBUG is set" in out


def test_rejected_hide_still_withdraws_and_reports_failure(publications, mocker):
    mock_hide = mocker.patch(
        f"{DIR}.hide_datacite_doi",
        side_effect=[DataCiteError("DataCite hide of 10.12345/aaaa failed (HTTP 422): draft"), {"data": {}}],
    )

    with pytest.raises(CommandError, match="1 DOI\\(s\\) not updated at DataCite: test.project-1"):
        run("test.project-1", "test.project-9")

    assert not is_published("test.project-1")
    assert [call.args[0] for call in mock_hide.call_args_list] == ["10.12345/aaaa", "10.12345/zzzz"]


# ---------------------------------------------------------------------------
# --restore
# ---------------------------------------------------------------------------


def test_restore_republishes_and_makes_doi_findable(publications, mock_hide, mock_publish):
    out, _ = run("--restore", "test.project-9")

    assert is_published("test.project-9")
    mock_publish.assert_called_once_with("10.12345/zzzz", url=None, metadata=LIVE_METADATA)
    mock_hide.assert_not_called()
    assert "Restored test.project-9 v1" in out
    assert "Made 10.12345/zzzz findable (test.project-9 v1)" in out


def test_restore_reverses_a_withdrawal(publications, mock_hide, mock_publish):
    run("test.project-1")
    run("--restore", "test.project-1")

    assert is_published("test.project-1")
    mock_hide.assert_called_once_with("10.12345/aaaa")
    mock_publish.assert_called_once_with("10.12345/aaaa", url=None, metadata=LIVE_METADATA)


def test_restore_of_published_publication_retries_the_publish(publications, mock_publish):
    out, _ = run("--restore", "test.project-1")

    assert is_published("test.project-1")
    mock_publish.assert_called_once_with("10.12345/aaaa", url=None, metadata=LIVE_METADATA)
    assert "test.project-1 v2 was already published" in out


def test_restore_sends_the_live_versions_metadata(publications, mock_publish, mock_doi_update):
    """A republish's DOI still has the previous version's URL and metadata when
    publish_publication_doi runs out of retries, so --restore sends the live version's."""
    run("--restore", "test.project-1")

    (publication,) = mock_doi_update.call_args.args
    assert (publication.project_id, publication.version) == ("test.project-1", 2)


def test_restore_falls_back_to_the_url_when_metadata_cant_be_built(publications, mock_publish, mock_doi_update):
    mock_doi_update.return_value = ("https://example.org/live", None)

    run("--restore", "test.project-1")

    mock_publish.assert_called_once_with("10.12345/aaaa", url="https://example.org/live", metadata=None)


def test_withdraw_doesnt_rebuild_metadata(publications, mock_hide, mock_doi_update):
    run("test.project-1")

    mock_doi_update.assert_not_called()


def test_restore_without_doi_or_in_debug_skips_datacite(publications, mock_publish, settings):
    settings.DEBUG = True
    Publication.objects.filter(project_id="test.project-2").update(is_published=False)

    out, _ = run("--restore", "test.project-2", "test.project-9")

    assert is_published("test.project-2") and is_published("test.project-9")
    mock_publish.assert_not_called()
    assert "Skipped DataCite publish for test.project-2 v1: no DOI" in out
    assert "Skipped DataCite publish for 10.12345/zzzz (test.project-9 v1): DEBUG is set" in out


def test_restore_unknown_id_is_an_error_and_nothing_is_restored(publications, mock_publish):
    with pytest.raises(CommandError, match="No publication found for: test.project-404"):
        run("--restore", "test.project-9", "test.project-404")

    assert not is_published("test.project-9")
    mock_publish.assert_not_called()


def test_restore_rejected_publish_still_restores_and_reports_failure(publications, mocker):
    Publication.objects.filter(project_id="test.project-9").update(is_indexable=False)
    mocker.patch(
        f"{DIR}.publish_datacite_doi",
        side_effect=DataCiteError("DataCite publish of 10.12345/zzzz failed (HTTP 422): invalid"),
    )

    with pytest.raises(
        CommandError, match="1 DOI\\(s\\) not updated at DataCite: test.project-9. Their publications are restored"
    ):
        run("--restore", "test.project-9")

    assert is_published("test.project-9")
    assert not is_indexable("test.project-9")


def is_indexable(project_id):
    return Publication.objects.get(project_id=project_id).is_indexable


def test_restore_marks_publication_indexable_once_doi_is_findable(publications, mock_publish):
    """--restore is the remedy when publish_publication_doi runs out of retries, which leaves the page
    noindex and out of the sitemap."""
    Publication.objects.filter(project_id="test.project-1").update(is_indexable=False)

    out, _ = run("--restore", "test.project-1")

    assert is_indexable("test.project-1")
    assert "Marked test.project-1 v2 indexable" in out


def test_restore_without_datacite_call_marks_publication_indexable(publications, mock_publish, settings):
    settings.DEBUG = True
    Publication.objects.filter(project_id__in=["test.project-2", "test.project-9"]).update(is_indexable=False)

    run("--restore", "test.project-2", "test.project-9")

    assert is_indexable("test.project-2") and is_indexable("test.project-9")


def test_withdraw_leaves_is_indexable_alone(publications, mock_hide):
    """Withdrawal is governed by is_published; restoring must not have to re-derive indexability."""
    run("test.project-1")

    assert is_indexable("test.project-1")
