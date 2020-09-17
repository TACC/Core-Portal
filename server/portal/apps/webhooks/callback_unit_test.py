
from portal.apps.keyservice.models import KeyServiceOperation
from mock import patch, MagicMock
from django.contrib.auth import get_user_model
from django.db.models import signals
from django.test import TransactionTestCase
from portal.apps.keyservice.callback import (
    KeyServiceCallback,
    load_keyservice_callback
)

class MockCallback(KeyServiceCallback):
    def success(self, operation, system):
        pass

    def failure(self, operation, result):
        pass

class InvalidCallback(object):
    pass

def mock_invalid_function():
    pass

class TestKeyServiceCallback(TransactionTestCase):
    def setUp(self):
        super(TestKeyServiceCallback, self).setUp()

    def tearDown(self):
        super(TestKeyServiceCallback, self).tearDown()

    def test_load_callback(self):
        result = load_keyservice_callback('portal.apps.keyservice.callback_unit_test.MockCallback')
        self.assertIsInstance(result, MockCallback)
        with self.assertRaises(ValueError):
            load_keyservice_callback('portal.apps.keyservice.callback_unit_test.InvalidCallback')
        with self.assertRaises(ValueError):
            load_keyservice_callback('portal.apps.keyservice.callback_unit_test.mock_invalid_function')

