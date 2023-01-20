import json

from django.conf import settings
from django.contrib.postgres.fields import (
    JSONField as DjangoJSONField
)
from django.db.models import Field


# NOTE: TODO_django: Django v3 introduces a native JSONField, so this file will be obsolete.
# https://docs.djangoproject.com/en/3.2/ref/models/fields/#django.db.models.JSONField

# Hack for loading Field class appropriate to either Postgres or SQLite (testing db)
# from https://medium.com/@philamersune/using-postgresql-jsonfield-in-sqlite-95ad4ad2e5f1


if 'sqlite' in settings.DATABASES['default']['ENGINE']:
    class JSONField(Field):
        def db_type(self, connection):
            return 'text'

        def from_db_value(self, value, expression, connection):
            if value is not None:
                return self.to_python(value)
            return value

        def to_python(self, value):
            if value is not None:
                try:
                    return json.loads(value)
                except (TypeError, ValueError):
                    return value
            return value

        def get_prep_value(self, value):
            if value is not None:
                return str(json.dumps(value))
            return value

        def value_to_string(self, obj):
            return self.value_from_object(obj)
else:
    class JSONField(DjangoJSONField):
        pass
