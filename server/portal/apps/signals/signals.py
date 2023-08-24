from django.dispatch import Signal

# Generic event signal. Not in use as of 6.29.20
# portal_event = Signal(providing_args=['event_type', 'event_data', 'event_users'])

# Changes for Django 3.*
portal_event = Signal()
