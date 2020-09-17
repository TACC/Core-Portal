from abc import abstractmethod
from inspect import isclass
from importlib import import_module

class WebhookCallback(object):
    """class KeyServiceCallback

    An abstract base class for executing callback functions upon
    completion of a Keys Service Abaco Reactor call.
    """
    def __init__(self):
        pass

    @abstractmethod
    def callback(self, external_call, webhook_request):
        """
        A callback to execute if when a webhook was received

        :param external_call: An ExternalCall instance that represents the outbound call
        :param webhook_request: A the request object of the webhook callback
        """
        return NotImplemented
