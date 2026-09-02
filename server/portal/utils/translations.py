import copy
import logging
import urllib.error
import urllib.parse
import urllib.request
from urllib.parse import urlparse

LOGGER = logging.getLogger(__name__)


def url_parse_inputs(job):
    """
    Translates the inputs of an Agave job to be URL encoded
    """
    job = copy.deepcopy(job)
    for key, value in job["inputs"].items():
        # this could either be an array, or a string...
        if isinstance(value, str):
            parsed = urlparse(value)
            if parsed.scheme:
                job["inputs"][key] = f"{parsed.scheme}://{parsed.netloc}{urllib.parse.quote(parsed.path)}"
            else:
                job["inputs"][key] = urllib.parse.quote(parsed.path)
        else:
            # If array, replace it with new array where each element was parsed
            parsed_values = []
            for input in value:
                parsed = urlparse(input)
                input = f"{parsed.scheme}://{parsed.netloc}{urllib.parse.quote(parsed.path)}"
                parsed_values.append(input)
            job["inputs"][key] = parsed_values
    return job
