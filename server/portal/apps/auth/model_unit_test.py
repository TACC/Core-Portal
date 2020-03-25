from django.test import TransactionTestCase
from django.contrib.auth import get_user_model
from portal.apps.auth.models import AgaveOAuthToken


class TestAgaveOAuthToken(TransactionTestCase):
    fixtures = ['users']

    def setUp(self):
        super(TestAgaveOAuthToken, self).setUp()
        user = get_user_model().objects.get(username="username")
        self.token = AgaveOAuthToken(
            token_type="bearer",
            scope="default",
            access_token="12345678abcdefghi",
            refresh_token="123123123",
            expires_in=14400,
            created=1523633447)
        self.token.user = user
        self.token.save()
        user.save()

    def test_update_token(self):
        token_dict = {'token_type': "bearer",
                      'scope': "default",
                      'access_token': "12345678abcdefghi",
                      'refresh_token': "123123123",
                      'expires_in': 14400,
                      'created': 1523633447}
        self.token.update(**token_dict)
        self.assertEquals(self.token.token, token_dict)

    def test_masked_token(self):
        self.assertEquals(self.token.masked_token, "12345678---------")