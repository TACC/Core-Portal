"""
.. :module:: portal.libs.agave.models.unit_test
   :synopsis: Unit tests for Public Data app.
"""
from __future__ import unicode_literals, absolute_import
import logging
from django.test import TestCase
from django.conf import settings

class TestPublicDataView(TestCase):
    
    def test_public_view(self):
        resp = self.client.get("/public_data/")
        self.assertEqual(resp.status_code, 200)
