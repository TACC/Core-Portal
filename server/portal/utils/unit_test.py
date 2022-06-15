from django.test import TestCase, override_settings
from mock import patch, Mock
from django.contrib.auth import get_user_model
from portal.utils.translations import get_jupyter_url
from portal.utils.translations import url_parse_inputs
from portal.utils.jwt_auth import login_user_agave_jwt


class TestTranslations(TestCase):
    """Test Translations."""
    fixtures = ['users', 'auth']

    def setUp(self):
        """Setup."""
        super(TestTranslations, self).setUp()
        self.user = get_user_model().objects.get(username='username')
        self.job = {
            "inputs": {
                "inputFile": "agave://test.system/test file.txt",
                "inputFiles": [
                    "agave://test.system/test file 1.txt",
                    "agave://test.system/test file 2.txt"
                ]
            }
        }

    @override_settings(
        PORTAL_JUPYTER_URL=None,
        PORTAL_JUPYTER_SYSTEM_MAP=None
    )
    def test_no_jupyter_config(self):
        result = get_jupyter_url(
            "data-tacc-work-mock",
            "/filename.txt", self.user.username
        )
        self.assertIsNone(result)

    @override_settings(
        PORTAL_JUPYTER_URL="https://mock.jupyter.url",
        PORTAL_JUPYTER_SYSTEM_MAP={
            "data-tacc-work-{username}": "/tacc-work",
            "data-sd2e-projects-users": "/sd2e-projects",
            "data-sd2e-community": "/sd2e-community"
        }
    )
    def test_get_jupyter_url(self):
        """Test get_jupyter_url.

        Should return None if there is no
        file manager -> jupyter mount point mapping for
        the requested file manager
        """
        result = get_jupyter_url(
            "unknown",
            "/filename.txt",
            self.user.username
        )
        self.assertIsNone(result)

        # If username is None, should return None
        result = get_jupyter_url(
            "unknown",
            "/filename.txt",
            None
        )
        self.assertIsNone(result)

        # On a valid request and server side configuration,
        # return a jupyter url for a file
        result = get_jupyter_url(
            "data-tacc-work-username",
            "/filename.txt",
            self.user.username
        )
        url = "https://mock.jupyter.url/user/{username}/edit/tacc-work/filename.txt".format(
            username=self.user.username
        )
        self.assertEqual(result, url)

        # If the filename ends with .ipynb, it should generate a /notebooks url
        result = get_jupyter_url(
            "data-tacc-work-username",
            "/notebook.ipynb",
            self.user.username
        )
        url = "https://mock.jupyter.url/user/{username}/notebooks/tacc-work/notebook.ipynb".format(
            username=self.user.username
        )
        self.assertEqual(result, url)

        # If the filename has no extension,
        # it still be edited as a regular file
        result = get_jupyter_url(
            "data-tacc-work-username",
            "/regular", self.user.username
        )
        url = "https://mock.jupyter.url/user/{username}/edit/tacc-work/regular".format(
            username=self.user.username
        )
        self.assertEqual(result, url)

        # If the filepath is a directory, it should generate a /tree url
        result = get_jupyter_url(
            "data-tacc-work-username",
            "/directory",
            self.user.username,
            is_dir=True
        )
        url = "https://mock.jupyter.url/user/{username}/tree/tacc-work/directory".format(
            username=self.user.username
        )
        self.assertEqual(result, url)

    def test_url_parse_inputs(self):
        result = url_parse_inputs(self.job)
        self.assertEqual(
            result["inputs"]["inputFile"],
            "agave://test.system/test%20file.txt"
        )
        self.assertEqual(
            result["inputs"]["inputFiles"][0],
            "agave://test.system/test%20file%201.txt"
        )
        self.assertEqual(
            result["inputs"]["inputFiles"][1],
            "agave://test.system/test%20file%202.txt"
        )

        # Assert original object has not mutated
        self.assertEqual(
            self.job["inputs"]["inputFile"],
            "agave://test.system/test file.txt"
        )
        self.assertNotEqual(self.job, result)


class TestAgaveJWTAuth(TestCase):
    """Test Agave JWT Auth."""

    fixtures = ['users', 'auth']

    @patch('portal.utils.jwt_auth.login')
    @patch('portal.utils.jwt_auth._get_jwt_payload', return_value='payload')
    @patch(
        'portal.utils.jwt_auth._decode_jwt',
        return_value={
            'http://wso2.org/claims/usertype': 'APPLICATION_USER',
            'http://wso2.org/claims/tier': 'Unlimited',
            'iss': 'wso2.org/products/am',
            'http://wso2.org/claims/lastname': 'Portal',
            'http://wso2.org/claims/applicationtier': 'Unlimited',
            'http://wso2.org/claims/applicationid': '89',
            'http://wso2.org/claims/subscriber': 'PORTALS/wma_prtl',
            'http://wso2.org/claims/enduserTenantId': '-1234',
            'http://wso2.org/claims/emailaddress': 'aci-wma@tacc.utexas.edu',
            'http://wso2.org/claims/version': 'v2',
            'http://wso2.org/claims/keytype': 'PRODUCTION',
            'exp': 1554836586702,
            'http://wso2.org/claims/applicationname': 'josuebc.cli',
            'http://wso2.org/claims/role': (
                'Internal/PORTALS_wma_prtl_cep.dev_PRODUCTION,'
            ),
            'http://wso2.org/claims/givenname': 'WMA',
            'http://wso2.org/claims/apicontext': '/projects-cep/v2',
            'http://wso2.org/claims/fullname': 'wma_prtl',
            'http://wso2.org/claims/enduser': 'wma_prtl@carbon.super'
        }
    )
    def test_login_user_agave_jwt(
            self,
            mock_decode_jwt,
            mock_get_jwt_payload,
            mock_login
    ):
        """Test login_user_agave_jwt.

        If everything goes well, the request is logged in and passed to the view.
        """
        mock_request = Mock()
        login_user_agave_jwt(mock_request)
        user = get_user_model().objects.get(username='wma_prtl')

        mock_get_jwt_payload.assert_called_with(mock_request)
        mock_decode_jwt.assert_called_with(mock_get_jwt_payload())
        self.assertEqual(len(mock_login.mock_calls), 1)
        mock_login.assert_called_with(mock_request, user)

    @override_settings(
        AGAVE_JWT_PUBKEY='pub-key==',
        AGAVE_JWT_HEADER='x_agave_header'
    )
    @patch('portal.utils.jwt_auth.login')
    @patch('portal.utils.jwt_auth._get_jwt_payload', return_value=None)
    def test_agave_jwt_no_payload(self, mock_get_jwt_payload, mock_login):
        """Test Agave jwt with no payload.

        If there's no payload user is not going to be logged in.
        """
        mock_request = Mock()
        login_user_agave_jwt(mock_request)
        self.assertEqual(len(mock_login.mock_calls), 0)

    @override_settings(
        AGAVE_JWT_PUBKEY='pub-key==',
        AGAVE_JWT_HEADER='x_agave_header'
    )
    @patch('portal.utils.jwt_auth.login')
    @patch('portal.utils.jwt_auth._get_jwt_payload', return_value='payload')
    def test_agave_jwt_no_decode(self, mock_get_jwt_payload, mock_login):
        """Test Agave jwt with nothing decoded.

        If nothing could be decoded user is not logged in.
        """
        mock_request = Mock()
        login_user_agave_jwt(mock_request)
        self.assertEqual(len(mock_login.mock_calls), 0)

    @patch('portal.utils.jwt_auth.login')
    @patch('portal.utils.jwt_auth._get_jwt_payload', return_value='payload')
    @patch('portal.utils.jwt_auth._decode_jwt', return_value={'http://wso2.org/claims/fullname': 'wma_prtl'})
    @patch('portal.apps.auth.models.TapisOAuthToken.client', autospec=True)
    def test_agave_jwt_expired_token(self,
                                     mock_client,
                                     mock_decode_jwt,
                                     mock_get_jwt_payload,
                                     mock_login):

        user = get_user_model().objects.get(username='wma_prtl')
        user.tapis_oauth.expires_in = 0
        user.tapis_oauth.save()
        self.assertTrue(user.tapis_oauth.expired)

        def refresh_token(*args, **kwargs):
            user.tapis_oauth.expires_in = 13253919840009999
            user.tapis_oauth.save()
            return user.tapis_oauth.refresh_token

        mock_client.token.refresh.side_effect = refresh_token

        mock_request = Mock()
        login_user_agave_jwt(mock_request)
        mock_client.token.refresh.assert_called_once_with()
        self.assertFalse(user.tapis_oauth.expired)
