from portal.apps.notifications.models import Notification

NOTIFY_ACTIONS = ['move',
                  'copy',
                  'rename',
                  'trash',
                  'mkdir',
                  'upload',
                  'makepublic']


def notify(username, operation, status, extra):
    event_data = {
        Notification.EVENT_TYPE: 'data_files',
        Notification.STATUS: getattr(Notification, status.upper()),
        Notification.USER: username,
        Notification.EXTRA: extra,
        Notification.OPERATION: operation,
        Notification.READ: True
    }
    Notification.objects.create(**event_data)
