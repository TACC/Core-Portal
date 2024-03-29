import pytest
from portal.libs.agave.utils import text_preview, get_file_size
from tapipy.tapis import TapisResult

POSTIT_URL = "https://tapis.example/postit/something"


def test_text_preview(requests_mock):
    requests_mock.get(POSTIT_URL, text="file content")
    assert text_preview(POSTIT_URL) == "file content"


@pytest.mark.parametrize("NON_ASCII_TEXT", ["non-asci: »", "\N{GREEK CAPITAL LETTER DELTA}"])
def test_text_preview_non_ascii(requests_mock, NON_ASCII_TEXT):
    requests_mock.get(POSTIT_URL, text=NON_ASCII_TEXT)
    with pytest.raises(ValueError):
        text_preview(POSTIT_URL)


def test_get_file_size(mock_tapis_client, agave_file_listing_mock):
    mock_tapis_client.files.listFiles.return_value = [TapisResult(**f) for f in agave_file_listing_mock]
    assert get_file_size(mock_tapis_client, "system", "file") == 5
