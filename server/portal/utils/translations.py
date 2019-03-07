import os
import six
import urllib
import copy
from urlparse import urlparse
from django.conf import settings

def get_jupyter_url(system, path, username, is_dir=False):
    """Translate file path and system to Jupyter URL
    
    Requires PORTAL_JUPYTER_URL and PORTAL_JUPYTER_SYSTEM_MAP settings
    Args:
        system: agave system
        path: file or directory path
        username: current user
        is_dir: True if path is a directory
    Returns:
        a Jupyter URL for viewing notebooks, editing text files or showing directory listings
    """
    portal_jupyter_url = getattr(settings, 'PORTAL_JUPYTER_URL', None)
    portal_jupyter_system_map = getattr(settings, 'PORTAL_JUPYTER_SYSTEM_MAP', None)

    if (portal_jupyter_url is None or portal_jupyter_system_map is None):
        return None

    # Have to make a storage system map -> jupyter mount point map with portal-home-{username} keys replaced
    user_replace = lambda k : k.replace("{username}", username)
    system_map = {
        user_replace(k) : user_replace(v) for (k, v) in portal_jupyter_system_map.iteritems()
    }

    # Check to see that the request file manager is configured to a Jupyter mount point
    if system not in system_map:
        return None

    # Default action is to /edit a file
    action = "/edit"

    # If the filename ends with .ipynb, the action is to open as /notebooks
    _ , ext = os.path.splitext(path)
    if ext == ".ipynb":
        action = "/notebooks"
    
    if is_dir:
        action = "/tree"

    # Return URL string for file manager/filename
    return "{portal_jupyter_url}/user/{username}{action}{system}{path}".format(
        portal_jupyter_url=portal_jupyter_url,
        username=username,
        action=action,
        system=system_map[system],
        path=path
    )

def url_parse_inputs(job):
    """
    Translates the inputs of an Agave job to be URL encoded
    """
    job = copy.deepcopy(job)
    for key, value in six.iteritems(job['inputs']):
        # this could either be an array, or a string...
        if isinstance(value, basestring):
            parsed = urlparse(value)
            if parsed.scheme:
                job['inputs'][key] = '{}://{}{}'.format(
                    parsed.scheme, parsed.netloc, urllib.quote(parsed.path))
            else:
                job['inputs'][key] = urllib.quote(parsed.path)
        else:
            # If array, replace it with new array where each element was parsed
            parsed_values = [ ]
            for input in value:
                parsed = urlparse(input)
                input = '{}://{}{}'.format(
                    parsed.scheme, parsed.netloc, urllib.quote(parsed.path))
                parsed_values.append(input)
            job['inputs'][key] = parsed_values
    return job