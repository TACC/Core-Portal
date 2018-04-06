"""
.. :module:: apps.accounts.steps
   :synopsis: User setup custom steps sample
"""
from __future__ import unicode_literals, absolute_import
import logging

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

def step_one(*args):
    """Sample function step"""
    logger.debug('Func Step one')
    logger.debug(args)

def step_two(*args):
    """Sample function step"""
    logger.debug('Func Step two')
    logger.debug(args)

class StepThree(object):
    """Sample Class Step"""
    def __init__(self, *args):
        logger.debug('Class Step init')
        logger.debug(args)

    def step(self, *args):
        """Step Three class step"""
        logger.debug('Class step')
        logger.debug(args)
