"""
.. :module:: portal.libs.agave.unit_test
   :synopsis: Unit tests for Agave libraries.
"""
import logging
import os
import json
import copy
from mock import patch, call
from django.test import TestCase
from django.conf import settings
from portal.libs.agave import utils as AgaveUtils
from tapipy.tapis import TapisResult

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


class TestAgaveUtils(TestCase):
    """Test Agave Serializers"""

    @classmethod
    def setUpClass(cls):
        super(TestAgaveUtils, cls).setUpClass()
        cls.magave_patcher = patch(
            'portal.apps.auth.models.TapisOAuthToken.client',
            autospec=True
        )
        cls.magave = cls.magave_patcher.start()

    @classmethod
    def tearDownClass(cls):
        cls.magave_patcher.stop()

    def setUp(self):
        agave_path = os.path.join(settings.BASE_DIR, 'fixtures/agave')

        with open(
            os.path.join(
                agave_path,
                'files',
                'file.json'
                )
        ) as _file:
            self.agave_file = json.load(_file)

        with open(
            os.path.join(
                agave_path,
                'files',
                'directory.json'
                )
        ) as _file:
            self.agave_directory = json.load(_file)

        with open(
            os.path.join(
                agave_path,
                'files',
                'listing.json'
                )
        ) as _file:
            self.agave_listing = json.load(_file)

        with open(
            os.path.join(
                agave_path,
                'files',
                'file-listing.json'
                )
        ) as _file:
            self.agave_file_listing = [TapisResult(**f) for f in json.load(_file)]

    def test_to_camel_case(self):
        """Test `to_camel_case` util."""
        attr = 'some_attribute'
        res = AgaveUtils.to_camel_case(attr)
        self.assertEqual(res, 'someAttribute')

    def test_walk_levels(self):
        """Test `walk_levels` util."""
        self.magave.reset_mock()
        agave_dir = [obj for obj in self.agave_listing
                     if obj['type'] == 'dir' and obj['name'] != '.'][0]
        sub_root = copy.deepcopy(agave_dir)
        sub_root['name'] = '.'
        listings = [
            [TapisResult(**f) for f in self.agave_listing],
            [TapisResult(**sub_root), TapisResult(**self.agave_file)],
        ]
        listings_check = [
            self.agave_listing,
            [sub_root, self.agave_file],
        ]
        self.magave.files.listFiles.side_effect = listings

        levels_visited = []

        for root, folders, files in AgaveUtils.walk_levels(
                self.magave,
                self.agave_listing[0]['system'],
                self.agave_listing[0]['path']
        ):
            levels_visited.append((root, folders, files))

        self.assertEqual(
            self.magave.files.listFiles.call_args_list,
            [call(
                systemId=self.agave_listing[0]['system'],
                path=self.agave_listing[0]['path'],
                offset=0,
                limit=100),
             call(
                 systemId=agave_dir['system'],
                 path=agave_dir['path'],
                 offset=0,
                 limit=100)
             ]
        )

        for index, level in enumerate(levels_visited):
            listing = listings_check[index]
            root = listing[0]['path']
            folders = [f['path'] for f in listing
                       if f['format'] == 'folder' and
                       f['name'] != '.']
            files = [f['path'] for f in listing
                     if f['format'] != 'folder']
            self.assertEqual(
                root,
                level[0]
            )
            self.assertEqual(
                folders,
                [f['path'] for f in level[1]]
            )
            self.assertEqual(
                files,
                [f['path'] for f in level[2]]
            )

    def test_increment_file_name(self):
        """Test `increment_file_name` util."""
        self.magave.reset_mock()
        file_name = 'some_file_name.txt'
        res = AgaveUtils.increment_file_name(self.agave_file_listing, file_name)
        self.assertEqual(res, 'some_file_name.txt')

        file_name = 'file.txt'
        res = AgaveUtils.increment_file_name(self.agave_file_listing, file_name)
        self.assertEqual(res, 'file(1).txt')
