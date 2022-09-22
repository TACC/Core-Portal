import logging


logger = logging.getLogger(__name__)


def tapis_get_handler(client, operation, **kwargs):
    op = getattr(client.apps, operation)
    return op(**kwargs)


def tapis_post_handler(client, operation, body=None, **kwargs):

    op = getattr(client.apps, operation)
    return op(**kwargs)


def tapis_put_handler(client, operation, body=None, **kwargs):
    op = getattr(client.apps, operation)

    return op(**kwargs)


def tapis_jobs_get_handler(client, operation, **kwargs):
    op = getattr(client.jobs, operation)
    return op(**kwargs)


def tapis_jobs_post_handler(client, operation, body=None, **kwargs):
    op = getattr(client.jobs, operation)
    return op(**kwargs)


def tapis_jobs_put_handler(client, operation, body=None, **kwargs):
    op = getattr(client.jobs, operation)

    return op(**kwargs)
