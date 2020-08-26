from django.conf import settings
# TODO: Re-implement captcha
# from snowpenguin.django.recaptcha2.fields import ReCaptchaField
# from snowpenguin.django.recaptcha2.widgets import ReCaptchaWidget

from pytas.http import TASClient
import logging


logger = logging.getLogger(__name__)


tas = TASClient(baseURL=settings.TAS_URL, credentials={'username': settings.TAS_CLIENT_KEY, 'password': settings.TAS_CLIENT_SECRET})


ELIGIBLE = 'Eligible'
INELIGIBLE = 'Ineligible'
REQUESTED = 'Requested'
PI_ELIGIBILITY = (
    ('', 'Choose One'),
    (ELIGIBLE, ELIGIBLE),
    (INELIGIBLE, INELIGIBLE),
    (REQUESTED, REQUESTED),
)

USER_PROFILE_TITLES = (
    ('', 'Choose one'),
    ('Center Non-Researcher Staff', 'Center Non-Researcher Staff'),
    ('Center Researcher Staff', 'Center Researcher Staff'),
    ('Faculty', 'Faculty'),
    ('Government User', 'Government User'),
    ('Graduate Student', 'Graduate Student'),
    ('High School Student', 'High School Student'),
    ('High School Teacher', 'High School Teacher'),
    ('Industrial User', 'Industrial User'),
    ('Unaffiliated User', 'Unaffiliated User'),
    ('Nonprofit User', 'Nonprofit User'),
    ('NSF Graduate Research Fellow', 'NSF Graduate Research Fellow'),
    ('Other User', 'Other User'),
    ('Postdoctorate', 'Postdoctorate'),
    ('Undergraduate Student', 'Undergraduate Student'),
    ('Unknown', 'Unknown'),
    ('University Non-Research Staff', 'University Non-Research Staff'),
    ('University Research Staff', 'University Research Staff (excluding postdoctorates)'),
)

ETHNICITY_OPTIONS = (
    ('', 'Choose one'),
    ('Decline', 'Decline to Identify'),
    ('White', 'White'),
    ('Asian', 'Asian'),
    ('Black or African American', 'Black or African American'),
    ('Hispanic or Latino', 'Hispanic or Latino'),
    ('American Indian or Alaska Native', 'American Indian or Alaska Native'),
    ('Native Hawaiian or Other Pacific Islander', 'Native Hawaiian or Other Pacific Islander'),
    ('Two or more races', 'Two or more races, not Hispanic')
)

GENDER_OPTIONS = (
    ('', 'Choose one'),
    ('Decline', 'Decline to Identify'),
    ('Male', 'Male'),
    ('Female', 'Female'),
    ('Other', 'Other'),
)

PROFESSIONAL_LEVEL_OPTIONS = (
    ('Undergraduate Student', 'Undergraduate Student'),
    ('Graduate Student', 'Graduate Student'),
    ('Postdoctoral Researcher', 'Postdoctoral Researcher'),
    ('Faculty or Researcher', 'Faculty or Researcher'),
    ('Staff (support, administration, etc)', 'Staff (support, administration, etc)'),
    ('Practicing Engineer or Architect', 'Practicing Engineer or Architect'),
    ('Other', 'Other')
)


def get_institution_choices():
    institutions_list = tas.institutions()
    return (('', 'Choose one'),) + tuple((c['id'], c['name']) for c in institutions_list)


def get_department_choices(institutionId):
    departments_list = tas.get_departments(institutionId)
    return (('', 'Choose one'),) + tuple((c['id'], c['name']) for c in departments_list)


def get_country_choices():
    countries_list = tas.countries()
    return (('', 'Choose one'),) + tuple((c['id'], c['name']) for c in countries_list)
