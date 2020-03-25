from django.dispatch import Signal

# portal_event = Signal(providing_args=['session_id', 'event_type', 'event_data'])
portal_event = Signal(providing_args=['event_type', 'event_data', 'event_users'])
