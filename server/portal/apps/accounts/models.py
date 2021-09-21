"""
.. :module:: apps.accounts.managers.models
   :synopsis: Account's models
"""
import logging
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.core.mail import send_mail
from django.db import models
from django.utils.translation import ugettext_lazy as _
from portal.utils import encryption as EncryptionUtil


# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


class PortalProfile(models.Model):
    """Profile Model

    Extending the user model to store extra data
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        related_name='profile',
        on_delete=models.CASCADE
    )
    ethnicity = models.CharField(max_length=255)
    gender = models.CharField(max_length=255)
    bio = models.CharField(max_length=4096, default=None, null=True, blank=True)
    website = models.CharField(max_length=256, default=None, null=True, blank=True)
    orcid_id = models.CharField(max_length=256, default=None, null=True, blank=True)
    professional_level = models.CharField(max_length=256, default=None, null=True)

    # Default to False. If PORTAL_USER_ACCOUNT_SETUP_STEPS is empty,
    # setup_complete will be set to True on first login
    setup_complete = models.BooleanField(default=False)

    def send_mail(self, subject, body=None):
        """Send mail to user"""
        send_mail(subject,
                  body,
                  settings.DEFAULT_FROM_EMAIL,
                  [self.user.email],
                  html_message=body)


class NotificationPreferences(models.Model):
    """Notification Preferences

    .. todo: Should we have a `Preferences` model and store there
    all different kinds of preferences?
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL,
                                related_name='notification_preferences',
                                on_delete=models.CASCADE)
    announcements = models.BooleanField(
        default=True,
        verbose_name=_('Receive occasional announcements'))

    class Meta:
        permissions = (
            ('view_notification_subscribers',
             'Can view list of users subscribed to a notification type'),
        )


class PortalProfileNHInterests(models.Model):
    """Portal Profile NH Interests"""
    description = models.CharField(max_length=300)


class PortalProfileResearchActivities(models.Model):
    """Resesarch Activities"""
    description = models.CharField(max_length=300)


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
        try:
            keys = Keys.objects.get(
                ssh_keys__user=user,
                system=system_id
            )
        except ObjectDoesNotExist:
            try:
                ssh_keys = super(
                    SSHKeysManager,
                    self
                ).get_queryset().get(user=user)
            except ObjectDoesNotExist:
                ssh_keys = super(
                    SSHKeysManager,
                    self
                ).create(user=user)
            keys = Keys.objects.create(ssh_keys=ssh_keys, system=system_id)

        keys.public = pub_key
        keys.private = priv_key
        keys.save()
        return super(
            SSHKeysManager,
            self
        ).get_queryset().get(user=user)

    def save_hostname_keys(
            self,
            user,
            hostname,
            priv_key,
            pub_key,
    ):
        """Saves a new set of keys for a specific system and user obj

        :param user: Django user object
        :param str hostname: system hostname
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
            HostKeys.objects.get(
                ssh_keys__user=user,
                hostname=hostname
            )
        except ObjectDoesNotExist:
            ssh_keys = super(SSHKeysManager, self).create(user=user)
            HostKeys.objects.create(
                ssh_keys=ssh_keys,
                hostname=hostname,
                private=priv_key,
                public=pub_key
            )
            return ssh_keys
        raise ValueError(
            """A set of keys for hostname: '{hostname}' and username: '{username}'
               already exists""".format(
                hostname=hostname,
                username=user.username)
        )

    def update_hostname_keys(self, user, hostname, priv_key, pub_key):
        """Update set of keys for a specific user and system

        :param user: Django user obj
        :param str hostname: system hostname
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
        try:
            keys = HostKeys.objects.get(
                ssh_keys__user=user,
                hostname=hostname
            )
        except ObjectDoesNotExist:
            try:
                ssh_keys = super(
                    SSHKeysManager,
                    self
                ).get_queryset().get(user=user)
            except ObjectDoesNotExist:
                ssh_keys = super(
                    SSHKeysManager,
                    self
                ).create(user=user)
            keys = HostKeys.objects.create(ssh_keys=ssh_keys, hostname=hostname)

        keys.public = pub_key
        keys.private = priv_key
        keys.save()
        return super(
            SSHKeysManager,
            self
        ).get_queryset().get(user=user)


class SSHKeys(models.Model):
    """SSHKeys

    Model to store set of keys for a specific user and system

    .. note::
        This set of keys shoud **only** be used when creating systems
         and to show to the user for further remote config
    .. note::
        This model does not have a reverse lookup to the actual model
        holding the keys. This is only to try and make any other
        developers think twice about doing something with this set of
        keys.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        related_name='ssh_keys',
        on_delete=models.CASCADE)
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

    def for_hostname(self, hostname):
        """Returns a set of keys for a specific hostname

        :param str hostname: System hostname

        :returns: Set of keys
        :rtype: :class:`~Keys`

        :Example:

        Retreive set of keys for system
        >>> ssh_keys = SSHkeys.objects.get(user=user)
        >>> private = ssh_keys.for_hostname('data.tacc').private_key()
        >>> #or directly from the user object
        >>> django.contrib.auth import get_user
        >>> user = get_user(request)
        >>> user.ssh_keys.for_hostname('data.tacc').private_key()

        .. note::
            This query is purposley here to have two step retreival of keys.
            As well as having a more explicit syntax.
              See Example
        """
        keys = HostKeys.objects.get(ssh_keys=self, hostname=hostname)
        return keys

    def __str__(self):
        return str(self.user)


class Keys(models.Model):
    """Keys

    .. note::
        This class stores the initial private value to check
         if it changed. If it did then the save method will encrypt the key
         before saving it into the DB.
    """
    ssh_keys = models.ForeignKey(SSHKeys, related_name='+', on_delete=models.CASCADE)
    system = models.TextField(unique=True)
    private = models.TextField()
    public = models.TextField()

    def __init__(self, *args, **kwargs):
        super(Keys, self).__init__(*args, **kwargs)
        self._private = self.private

    def private_key(self):
        """Returns decrypted private key"""
        return EncryptionUtil.decrypt(self.private)

    def save(self, *args, **kwargs):  # pylint: disable=arguments-differ
        """Saves a set of keys

        .. note::
            The keys need to be given as clear text strings and will be
             encrypted using AES
        """
        if (self.private != self._private or
                self.pk is None):
            self.private = EncryptionUtil.encrypt(self.private)
        super(Keys, self).save(*args, **kwargs)
        self._private = self.private

    def __str__(self):
        return '{username}: {system}'.format(
            username=self.ssh_keys.user.username,
            system=self.system
        )


class HostKeys(models.Model):
    """Keys stored by hostname, mainly for execution systems

    .. note::
        The keys need to be given as clear text strings and will be
            encrypted using AES
    """

    hostname = models.TextField()
    ssh_keys = models.ForeignKey(SSHKeys, related_name='+', on_delete=models.CASCADE)
    private = models.TextField()
    public = models.TextField()

    class Meta:
        unique_together = (('hostname', 'ssh_keys'),)

    def __init__(self, *args, **kwargs):
        super(HostKeys, self).__init__(*args, **kwargs)
        self._private = self.private

    def private_key(self):
        """Returns decrypted private key"""
        return EncryptionUtil.decrypt(self.private)

    def save(self, *args, **kwargs):  # pylint: disable=arguments-differ
        """Saves a set of keys

        .. note::
            The keys need to be given as clear text strings and will be
             encrypted using AES
        """
        if (self.private != self._private or
                self.pk is None):
            self.private = EncryptionUtil.encrypt(self.private)
        super(HostKeys, self).save(*args, **kwargs)
        self._private = self.private

    def __str__(self):
        return '{username}: {host}'.format(
            username=self.ssh_keys.user.username,
            host=self.hostname
        )
