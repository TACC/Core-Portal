"""
.. :module:: apps.accounts.managers.models
   :synopsis: Account's models
"""
from __future__ import unicode_literals

import logging
import base64
from Crypto.Cipher import AES
from Crypto.Hash import SHA256
from Crypto import Random
from django.core.mail import send_mail
from django.conf import settings
from django.db import models
from django.utils.translation import ugettext_lazy as _
from django.core.exceptions import ObjectDoesNotExist
# Create your models here.


# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


class PortalProfile(models.Model):
    """Profile Model

    Extending the user model to store extra data
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        related_name='profile'
    )
    ethnicity = models.CharField(max_length=255)
    gender = models.CharField(max_length=255)

    def send_mail(self, subject, body=None):
        """Send mail to user"""
        send_mail(subject,
                  body,
                  settings.DEFAULT_FROM_EMAIL,
                  [self.user.email],
                  html_message=body)

    def __unicode__(self):
        return unicode(self.user)


class NotificationPreferences(models.Model):
    """Notification Preferences

    .. todo: Should we have a `Preferences` model and store there
    all different kinds of preferences?
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL,
                                related_name='notification_preferences')
    announcements = models.BooleanField(
        default=True,
        verbose_name=_('Receive occasional announcements from DesignSafe'))

    class Meta:
        permissions = (
            ('view_notification_subscribers',
             'Can view list of users subscribed to a notification type'),
        )

    def __unicode__(self):
        return unicode(self.user)


class PortalProfileNHInterests(models.Model):
    """Portal Profile NH Interests"""
    description = models.CharField(max_length=300)

    def __unicode__(self):
        return self.description


class PortalProfileResearchActivities(models.Model):
    """Resesarch Activities"""
    description = models.CharField(max_length=300)

    def __unicode__(self):
        return self.description


class SSHKeysManager(models.Manager):
    """SSHKeys Manager"""
    def save_keys(
            self,
            user,
            system_id,
            priv_key,
            pub_key,
    ):
        """Saves a new set of keys for a specific system and user obj

        :param user: Django user object
        :param str system_id: system id
        :param str priv_key: Private Key
        :param str pub_key: Public Key

        :returns: Set of keys
        :rtype: :class:`SSHKeys`

        :raises: ValueError if key set already exists for user and system

        .. note::
            The priv key need to be given as clear text strings and will be
             encrypted using AES
        """
        try:
            Keys.objects.get(
                ssh_keys__user=user,
                system=system_id
            )
        except ObjectDoesNotExist:
            ssh_keys = super(SSHKeysManager, self).create(user=user)
            Keys.objects.create(
                ssh_keys=ssh_keys,
                system=system_id,
                private=priv_key,
                public=pub_key
            )
            return ssh_keys
        raise ValueError(
            """A set of keys for system: '{system}' and username: '{username}'
               already exists""".format(
                   system=system_id,
                   username=user.username)
        )

    def update_keys(self, user, system_id, priv_key, pub_key):
        """Update set of keys for a specific user and system

        :param user: Django user obj
        :param str system_id: System id
        :param str priv_key: Private Key
        :param str pub_key: Public Key

        :returns: Set of keys
        :rtype: :class:`SSHKeys`

        :raises: ObjectDoesNotExist if there are no preexisting set of keys
            for specific user and system

        .. note::
            The keys need to be given as clear text strings and will be
             encrypted using AES
        """
        keys = Keys.objects.get(ssh_keys__user=user,
                                system=system_id)
        keys.public = pub_key
        keys.private = priv_key
        keys.save()
        return super(SSHKeysManager, self).get_query_set().\
            get(ssh_keys__user=user,
                system=system_id)


class SSHKeys(models.Model):
    """SSHKeys

    Model to store set of keys for a specific user and system

    .. note::
        This set of keys shoud **only** be used wen creating systems
         and to show to the user for further remote config
    .. note::
        This model does not have a reverse lookup to the actual model
        holding the keys. This is only to try and make any other
        developers think twice about doing something with this set of
        keys.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        related_name='ssh_keys')
    objects = SSHKeysManager()

    def for_system(self, system_id):
        """Returns set of keys for a specific system

        :param str system_id: System id

        :returns: Set of keys
        :rtype: :class:`~Keys`

        :Example:

        Retreive set of keys for system
        >>> ssh_keys = SSHkeys.objects.get(user=user)
        >>> private = ssh_keys.for_system('cep.home.username').private_key()
        >>> #or directly from the user object
        >>> django.contrib.auth import get_user
        >>> user = get_user(request)
        >>> user.ssh_keys.for_system('cep.home.username').private_key()

        .. note::
            This query is purposley here to have two step retreival of keys.
            As well as having a more explicit syntax.
              See Example

        """
        keys = Keys.objects.get(ssh_keys=self, system=system_id)
        return keys

    def __unicode__(self):
        return unicode(self.user)


class Keys(models.Model):
    """Keys

    .. note::
        This class stores the initial private value to check
         if it changed. If it did then the save method will encrypt the key
         before saving it into the DB.
    """
    ssh_keys = models.ForeignKey(SSHKeys, related_name='+')
    system = models.TextField()
    private = models.TextField()
    public = models.TextField()

    def __init__(self, *args, **kwargs):
        super(Keys, self).__init__(*args, **kwargs)
        self._private = self.private

    def private_key(self):
        """Returns decrypted private key"""
        return _decrypt(self.private)

    def save(self, *args, **kwargs):  # pylint: disable=arguments-differ
        """Saves a set of keys

        .. note::
            The keys need to be given as clear text strings and will be
             encrypted using AES
        """
        if (self.private != self._private or
                self.pk is None):
            self.private = _encrypt(self.private)
        super(Keys, self).save(*args, **kwargs)
        self._private = self.private

    def __unicode__(self):
        return '{username}: {system}'.format(
            username=self.ssh_keys.user.username,
            system=self.system
        )


def _encrypt(raw):
    """Encrypts string using AES

    :param str raw: raw string to encrypt

    .. note::
        Shamelessly copied from:
        https://stackoverflow.com/questions/42568262/how-to-encrypt-text-with-a-password-in-python/44212550#44212550
    """
    source = raw.encode('utf-8')
    # Use hash to make sure size is appropiate
    key = SHA256.new(settings.SECRET_KEY).digest()
    # pylint: disable=invalid-name
    IV = Random.new().read(AES.block_size)
    # pylint: enable=invalid-name
    encryptor = AES.new(key, AES.MODE_CBC, IV)
    # calculate needed padding
    padding = AES.block_size - len(source) % AES.block_size
    source += chr(padding) * padding
    # Python 3.x: source += bytes([padding]) * padding
    # store the IV at the beginning and encrypt
    data = IV + encryptor.encrypt(source)
    return base64.b64encode(data).decode("utf-8")


def _decrypt(raw):
    """Decrypts a base64 encoded string

    :param source: base64 encoded string
    """
    source = base64.b64decode(raw.encode("utf-8"))
    # use SHA-256 over our key to get a proper-sized AES key
    key = SHA256.new(settings.SECRET_KEY).digest()
    # extract the IV from the beginning
    # pylint: disable=invalid-name
    IV = source[:AES.block_size]
    # pylint: enable=invalid-name
    decryptor = AES.new(key, AES.MODE_CBC, IV)
    # decrypt
    data = decryptor.decrypt(source[AES.block_size:])
    # pick the padding value from the end;
    padding = ord(data[-1])
    # Python 3.x: padding = data[-1]
    # Python 3.x: if data[-padding:] != bytes([padding]) * padding:
    if data[-padding:] != chr(padding) * padding:
        raise ValueError("Invalid padding...")
    # remove the padding
    return data[:-padding]
