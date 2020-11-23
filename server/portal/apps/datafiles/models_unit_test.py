from portal.apps.datafiles.models import PublicUrl
import pytest


@pytest.mark.django_db
def test_public_url_nonce():
    public_url = PublicUrl.objects.create(
        agave_uri="mock.system/path",
        postit_url="https://tenant/postits/v2/listing/nonce"
    )
    assert public_url.get_nonce() == "nonce"
