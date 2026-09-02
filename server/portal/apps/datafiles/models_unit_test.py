from portal.apps.datafiles.models import Link
import pytest


@pytest.mark.django_db
def test_link_uuid():
    link = Link.objects.create(
        tapis_uri="mock.system/path",
        postit_url="https://tenant/postits/v2/listing/uuid"
    )
    assert link.get_uuid() == "uuid"
