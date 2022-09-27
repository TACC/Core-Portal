"""JWT Agave auth utils.
.. module:: portal.utils.jwt_auth
   :synopsis: Utilities to process agave JWT.
"""

import logging
from base64 import b64decode
from django.utils.six import text_type
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth import login
from django.core.exceptions import ObjectDoesNotExist
import jwt as pyjwt
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.serialization import load_der_public_key
from cryptography.exceptions import UnsupportedAlgorithm


LOGGER = logging.getLogger(__name__)


def _decode_jwt(jwt):
    """Verified signature on a jwt

    Uses public key to decode the jwt message.

    :param str jwt: JWT string
    :return: base64-decoded message
    """
    pubkey = settings.AGAVE_JWT_PUBKEY
    try:
        key_der = b64decode(pubkey)
        key = load_der_public_key(key_der, backend=default_backend())
    except (TypeError, ValueError, UnsupportedAlgorithm):
        LOGGER.exception('Could not load public key.')
        return {}

    try:
        decoded = pyjwt.decode(jwt, key, issuer=settings.AGAVE_JWT_ISSUER)
    except pyjwt.exceptions.DecodeError as exc:
        LOGGER.exception('Could not decode JWT. %s', exc)
        return {}
    return decoded


def _get_jwt_payload(request):
    """Return JWT payload as a string

    :param django.http.request request: Django Request
    :return: JWT payload
    :rtype: str
    """
    payload = request.META.get(getattr(settings, 'AGAVE_JWT_HEADER', ''))
    if payload and isinstance(payload, text_type):
        # Header encoding (see RFC5987)
        payload = payload.encode('iso-8859-1')

    return payload


def login_user_agave_jwt(request):
    """Login a user using JWT coming from Agave/Aloe.

    If the request comes from Agave (meaning, from WSO2) then we can
    use this function to authenticate the user based on the JWT
    in the request.

    .. note:: This function will modify the ``request`` object in place.
    """
    payload = _get_jwt_payload(request)
    if not payload:
        return None

    jwt_payload = _decode_jwt(payload)
    if not jwt_payload:
        return None

    username = jwt_payload.get(
        getattr(settings, 'AGAVE_JWT_USER_CLAIM_FIELD', ''),
        ''
    )
    try:
        user = get_user_model().objects.get(username=username)
    except ObjectDoesNotExist:
        LOGGER.exception('Could not find JWT user: %s', username)
        user = None

    if user is not None:
        user.backend = 'django.contrib.auth.backends.ModelBackend'
        login(request, user)

        # Refresh agave oauth token
        if user.tapis_oauth.expired:
            user.tapis_oauth.client.token.refresh()
