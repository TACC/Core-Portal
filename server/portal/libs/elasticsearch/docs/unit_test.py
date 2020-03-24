from mock import Mock, patch, MagicMock, PropertyMock, call
from django.test import TestCase
from django.contrib.auth import get_user_model
from portal.apps.auth.models import AgaveOAuthToken
from django.conf import settings
