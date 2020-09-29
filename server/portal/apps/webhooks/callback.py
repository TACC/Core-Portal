from abc import abstractmethod


class WebhookCallback(object):
    """class WebhookCallback

    An abstract base class for executing callback functions upon
    receiving a validated webhook.
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
