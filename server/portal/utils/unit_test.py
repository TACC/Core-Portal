from django.test import TestCase, override_settings
from mock import Mock, patch, MagicMock, PropertyMock, ANY
from django.test.client import RequestFactory
from django.http import HttpResponse
from django.contrib.auth import get_user_model
from django.test.client import Client
from portal.utils.translations import get_jupyter_url
from portal.utils.translations import url_parse_inputs

mock_jupyter_url = "https://mock.jupyter.url"
mock_system_map = { 
    "data-tacc-work-{username}" : "/tacc-work", 
    "data-sd2e-projects-users" : "/sd2e-projects",
    "data-sd2e-community" : "/sd2e-community"
}
mock_user = MagicMock(spec=get_user_model())
mock_user.username = "mock"

class TestGetJupyterUrl(TestCase):

    @override_settings(
        PORTAL_JUPYTER_URL=mock_jupyter_url,
        PORTAL_JUPYTER_SYSTEM_MAP=mock_system_map
    )
    def test_unknown_system(self):
        # Should return None if there is no file manager -> jupyter mount point mapping for
        # the requested file manager
        result = get_jupyter_url("unknown", "/filename.txt", mock_user.username)
        assert (result == None)

    @override_settings(
        PORTAL_JUPYTER_URL=None,
        PORTAL_JUPYTER_SYSTEM_MAP=None
    )

    def test_no_jupyter_config(self):
        result = get_jupyter_url("data-tacc-work-mock", "/filename.txt", mock_user.username)
        assert (result is None)

    @override_settings(
        PORTAL_JUPYTER_URL=mock_jupyter_url,
        PORTAL_JUPYTER_SYSTEM_MAP=mock_system_map
    )
    def test_get_jupyter_url(self):
        # On a valid request and server side configuration, return a jupyter url for a file
        result = get_jupyter_url("data-tacc-work-mock", "/filename.txt", mock_user.username)
        assert (result == "https://mock.jupyter.url/user/mock/edit/tacc-work/filename.txt")

        # If the filename ends with .ipynb, it should generate a /notebooks url
        result = get_jupyter_url("data-tacc-work-mock", "/notebook.ipynb", mock_user.username)
        assert (result == "https://mock.jupyter.url/user/mock/notebooks/tacc-work/notebook.ipynb")

        # If the filename has no extension, it still be edited as a regular file
        result = get_jupyter_url("data-tacc-work-mock", "/regular", mock_user.username)
        assert (result == "https://mock.jupyter.url/user/mock/edit/tacc-work/regular")

        # If the filepath is a directory, it should generate a /tree url
        result = get_jupyter_url("data-tacc-work-mock", "/directory", mock_user.username, is_dir=True)
        assert (result == "https://mock.jupyter.url/user/mock/tree/tacc-work/directory")


class TestUrlParseInputs(TestCase):
    
    def setUp(self):
        super(TestUrlParseInputs, self).setUp()
        self.job = {
            "inputs" : {
                "inputFile" : "agave://test.system/test file.txt",
                "inputFiles" : [
                    "agave://test.system/test file 1.txt",
                    "agave://test.system/test file 2.txt"
                ]
            }
        }

    def test_url_parse_inputs(self):
        result = url_parse_inputs(self.job)
        self.assertEqual(result["inputs"]["inputFile"], "agave://test.system/test%20file.txt")
        self.assertEqual(result["inputs"]["inputFiles"][0], "agave://test.system/test%20file%201.txt")
        self.assertEqual(result["inputs"]["inputFiles"][1], "agave://test.system/test%20file%202.txt")

        # Assert original object has not mutated
        self.assertEqual(self.job["inputs"]["inputFile"], "agave://test.system/test file.txt")
        self.assertNotEqual(self.job, result)