"""
Accounts views.
"""
from django.contrib.auth import logout   #, get_user_model  # Used in mailing_list_subscription.
from django.contrib import messages
from django.views.generic.base import TemplateView, View
from django.shortcuts import redirect, render, render_to_response
from django.conf import settings
from django.http import HttpResponseRedirect, HttpResponse
from django.contrib.auth.decorators import login_required   #, permission_required  # Used in mailing_list_subscription.
from django.utils.decorators import method_decorator
from django.core.exceptions import ObjectDoesNotExist
from django.core.urlresolvers import reverse
from django.db.models import Q
# from django.utils.translation import ugettext_lazy as _

from pytas.http import TASClient
from pytas.models import User as TASUser

from portal.apps.accounts import forms, integrations
from portal.apps.accounts.models import (PortalProfile,
                                             NotificationPreferences)

# from portal.apps.auth.tasks import check_or_create_agave_home_dir

import logging
import json
import rt

logger = logging.getLogger(__name__)

# Create your views here.

@method_decorator(login_required, name='dispatch')
class IndexView(TemplateView):
    """Main accounts view.
    """
    template_name = 'portal/apps/accounts/index.html'

    def dispatch(self, request, *args, **kwargs):
        return super(IndexView, self).dispatch(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super(IndexView, self).get_context_data(**kwargs)
        return context


class LoginView(TemplateView):
    """Login options view
    """
    template_name = 'portal/apps/accounts/login.html'

    def get_context_data(self, **kwargs):
        context = super(LoginView, self).get_context_data(**kwargs)
        return context


class LogoutView(View):
    """Logout view
    """
    def get(self, request):
        logout(request)
        return HttpResponseRedirect(settings.LOGIN_URL)


def request_access(request):
    if request.user.is_authenticated():
        messages.info(request, 'You are already logged in!')
        return HttpResponseRedirect('index')

    if request.method == 'POST':
        access_form = forms.RequestAccessForm(request.POST)

        if access_form.is_valid():
            data = access_form.cleaned_data
            username = data['username']
            password = data['password']

            tas = TASClient(baseURL=settings.TAS_URL, credentials={'username': settings.TAS_CLIENT_KEY, 'password': settings.TAS_CLIENT_SECRET})
            try:
                auth = tas.authenticate(username, password)
                if (username and password and auth):
                    user = tas.get_user(username=username)
                    tracker = rt.Rt(settings.RT_URL, settings.RT_UN, settings.RT_PW, basic_auth=(settings.RT_UN, settings.RT_PW))
                    if (tracker.login()):
                        tracker.create_ticket(Queue='SD2E',
                            Subject='New User Access Request',
                            Text='User ' + username + ' is requesting access to SD2E.',
                            Requestors=user['email'])
                        tracker.logout()
                        messages.success(request, "Your request has been submitted. An admin will be in contact with you as soon as possible.")
            except Exception as e:
                messages.warning(request, "We were unable to fulfill your request. Please try again and contact helpdesk if the problem persists.")


        else:
            messages.warning(request, "We were unable to fulfill your request. Please try again and contact helpdesk if the problem persists.")

    else:
        access_form = forms.RequestAccessForm()


    context = {
        'access_form': access_form
    }
    return render(request, 'portal/apps/accounts/request_access.html', context)


class RegisterView(TemplateView):
    """Register View
    """
    template_name = 'portal/apps/accounts/register_tup_only.html'

# TODO currently unused as everyone needs to go through TUP right now
def register(request):
    return render(request, 'portal/apps/accounts/register_tup_only.html')

def register_new(request):
    if request.user.is_authenticated():
        messages.info(request, 'You are already logged in!')
        return HttpResponseRedirect('portal_version_accounts:index')

    if request.method == 'POST':
        account_form = forms.UserRegistrationForm(request.POST)
        if account_form.is_valid():
            try:
                account_form.save()
                return HttpResponseRedirect(
                    reverse('portal_version_accounts:registration_successful'))
            except Exception as e:
                logger.info('error: {}'.format(e))

                error_type = e.args[1] if len(e.args) > 1 else ''

                if 'DuplicateLoginException' in error_type:
                    err_msg = (
                        'The username you chose has already been taken. Please '
                        'choose another. If you already have an account with TACC, '
                        'please log in using those credentials.')
                    account_form._errors.setdefault('username', [err_msg])
                elif 'DuplicateEmailException' in error_type:
                    err_msg = (
                        'This email is already registered. If you already have an '
                        'account with TACC, please log in using those credentials.')
                    account_form._errors.setdefault('email', [err_msg])
                    err_msg = '%s <a href="%s">Did you forget your password?</a>' % (
                        err_msg,
                        reverse('portal_version_accounts:password_reset'))
                elif 'PasswordInvalidException' in error_type:
                    err_msg = (
                        'The password you provided did not meet the complexity '
                        'requirements.')
                    account_form._errors.setdefault('password', [err_msg])
                else:

                    safe_data = account_form.cleaned_data.copy()
                    safe_data['password'] = safe_data['confirmPassword'] = '********'
                    logger.exception('User Registration Error!', extra=safe_data)
                    err_msg = (
                        'An unexpected error occurred. If this problem persists '
                        'please create a support ticket.')
                messages.error(request, err_msg)
        else:
            messages.error(request, 'There were errors processing your registration. '
                                    'Please see below for details.')
    else:
        account_form = forms.UserRegistrationForm()

    context = {
        'account_form': account_form
    }
    return render(request, 'portal/apps/accounts/register.html', context)


def registration_successful(request):
    return render_to_response('portal_version/apps/accounts/registration_successful.html')


# @login_required
# def test(request):
#     # return HttpResponseRedirect(reverse('portal_accounts:manage_profile'))
#     context = {
#         'title': 'TEST'
#     }
#     return render(request, 'portal/apps/accounts/test.html', context)
#
#
# @login_required
# def profile_test(request):
#     context = {
#         'title': 'Profile Stuff'
#     }
#     return render(request, 'portal/apps/accounts/profile_test.html', context)
#
#
# @login_required
# def index(request):
#     # return HttpResponseRedirect(reverse('portal_accounts:manage_profile'))
#     context = {
#         'title': 'Manage Profile'
#     }
#     return render(request, 'portal/apps/accounts/index.html', context)


@login_required
def manage_profile(request):
    """
    The default accounts view. Provides user settings for managing profile,
    authentication, notifications, identities, and applications.
    """
    django_user = request.user
    tas = TASClient(baseURL=settings.TAS_URL, credentials={'username': settings.TAS_CLIENT_KEY, 'password': settings.TAS_CLIENT_SECRET})
    user_profile = tas.get_user(username=request.user.username)

    try:
        demographics = django_user.profile
    except ObjectDoesNotExist as e:
        demographics = {}
        logger.info('exception e:{} {}'.format(type(e), e))

    context = {
        'title': 'Manage Profile',
        'profile': user_profile,
        'demographics': demographics
    }
    return render(request, 'portal/apps/accounts/profile.html', context)


@login_required
def manage_pro_profile(request):
    user = request.user
    try:
        portal_profile = PortalProfile.objects.get(user__id=user.id)
    except PortalProfile.DoesNotExist:
        logout(request)
        return HttpResponseRedirect(reverse('portal_auth:login'))
    context = {
        'title': 'Manage Professional Profile',
        'user': user,
        'profile': portal_profile
    }
    return render(request, 'portal/apps/accounts/professional_profile.html', context)


@login_required
def pro_profile_edit(request):
    context = {}
    user = request.user
    portal_profile = PortalProfile.objects.get(user_id=user.id)
    form = forms.ProfessionalProfileForm(request.POST or None, instance=portal_profile)
    if request.method == 'POST':
        if form.is_valid():
            form.save()
            return HttpResponseRedirect(reverse('portal_accounts:manage_pro_profile'))
    context["form"] = form
    return render(request, 'portal/apps/accounts/professional_profile_edit.html', context)


@login_required
def manage_authentication(request):
    print(request.method)
    if request.method == 'POST':
        form = forms.ChangePasswordForm(request.POST, username=request.user.username)
        if form.is_valid():
            form.save()
            messages.success(request, 'Your TACC Password has been successfully changed!')
    else:
        form = forms.ChangePasswordForm(username=request.user.username)

    context = {
        'title': 'Authentication Settings',
        'form': form
    }
    return render(request, 'portal/apps/accounts/manage_auth.html', context)


@login_required
def manage_identities(request):
    context = {
        'title': 'Manage Identities',
    }
    return render(request, 'portal/apps/accounts/manage_identities.html', context)


@login_required
def manage_notifications(request):
    try:
        prefs = NotificationPreferences.objects.get(user=request.user)
    except NotificationPreferences.DoesNotExist:
        prefs = NotificationPreferences(user=request.user)

    if request.method == 'POST':
        form = forms.NotificationPreferencesForm(request.POST, instance=prefs)
        form.save()
        messages.success(request, _('Your Notification Preferences have been updated!'))
    else:
        form = forms.NotificationPreferencesForm(instance=prefs)

    context = {
        'title': 'Notification Settings',
        'form': form,
    }

    return render(request, 'portal/apps/accounts/manage_notifications.html', context)


@login_required
def manage_licenses(request):
    from portal.apps.licenses.models import get_license_info
    licenses = get_license_info()

    for l in licenses:
        if request.user.licenses.filter(license_type=l['license_type']):
            l['current_user_license'] = True

    context = {
        'title': 'Manage Software Licenses',
        'licenses': licenses
    }
    return render(request, 'portal/apps/accounts/manage_licenses.html', context)


@login_required
def manage_applications(request):
    context = {
        'title': 'Manage Applications',
        'integrations': integrations.get_integrations()
    }
    return render(request, 'portal/apps/accounts/manage_applications.html', context)


@login_required
def profile_edit(request):
    tas = TASClient(baseURL=settings.TAS_URL, credentials={'username': settings.TAS_CLIENT_KEY, 'password': settings.TAS_CLIENT_SECRET})
    user = request.user
    tas_user = tas.get_user(username=user.username)

    if request.method == 'POST':
        form = forms.UserProfileForm(request.POST, initial=tas_user)
        if form.is_valid():
            data = form.cleaned_data
            # punt on PI Eligibility for now
            data['piEligibility'] = tas_user['piEligibility']

            # retain original account source
            data['source'] = tas_user['source']

            tas.save_user(tas_user['id'], data)
            messages.success(request, 'Your profile has been updated!')

            try:
                portal_profile = user.profile
                # portal_profile.ethnicity = data['ethnicity']
                # portal_profile.gender = data['gender']
                portal_profile.save()
            except ObjectDoesNotExist as e:
                logger.info('exception e: {} {}'.format(type(e), e ))
                portal_profile = PortalProfile(
                    user=user  #,
                    # ethnicity=data['ethnicity'],
                    # gender=data['gender']
                    )
                portal_profile.save()

            return HttpResponseRedirect(reverse('portal_accounts:manage_profile'))
    else:
        # try:
        #     tas_user['ethnicity'] = user.profile.ethnicity
        #     tas_user['gender'] = user.profile.gender
        # except ObjectDoesNotExist:
        #     pass

        form = forms.UserProfileForm(initial=tas_user)

    context = {
        'title': 'Manage Profile',
        'form': form,
    }
    return render(request, 'portal/apps/accounts/profile_edit.html', context)


def password_reset(request, code=None):
    if code is None:
        code = request.GET.get('code', None)

    if code is not None:
        # confirming password reset
        message = 'Confirm your password reset using the form below. Enter your TACC ' \
                  'username and new password to complete the password reset process.'

        if request.method == 'POST':
            form = forms.PasswordResetConfirmForm(request.POST)
            if _process_password_reset_confirm(request, form):
                messages.success(request, 'Your password has been reset! You can now log '
                                          'in using your new password')
                return HttpResponseRedirect(reverse('portal_accounts:manage_profile'))
            else:
                messages.error(request, 'Password reset failed. '
                                        'Please see below for details.')
        else:
            form = forms.PasswordResetConfirmForm(initial={'code': code})

    else:
        # requesting password reset
        message = 'Enter your TACC username to request a password reset. If your ' \
                  'account is found, you will receive an email at the registered email ' \
                  'address with instructions to complete the password reset.'

        if request.method == 'POST':
            form = forms.PasswordResetRequestForm(request.POST)
            if _process_password_reset_request(request, form):
                form = forms.PasswordResetRequestForm()
            else:
                messages.error(request, 'Password reset request failed. '
                                        'Please see below for details.')
        else:
            form = forms.PasswordResetRequestForm()

    return render(request, 'portal/apps/accounts/password_reset.html',
                  {'message': message, 'form': form})


def _process_password_reset_request(request, form):
    if form.is_valid():
        # always show success to prevent data leaks
        messages.success(request, 'Your request has been received. If an account '
                                  'matching the username you provided is found, you will '
                                  'receive an email with further instructions to '
                                  'complete the password reset process.')

        username = form.cleaned_data['username']
        logger.info('Attempting password reset request for username: "%s"', username)
        try:
            tas = TASClient()
            user = tas.get_user(username=username)
            logger.info('Processing password reset request for username: "%s"', username)
            resp = tas.request_password_reset(user['username'], source='DesignSafe')
            logger.debug(resp)
        except Exception as e:
            logger.exception('Failed password reset request')

        return True
    else:
        return False


def _process_password_reset_confirm(request, form):
    if form.is_valid():
        data = form.cleaned_data
        try:
            tas = TASClient()
            return tas.confirm_password_reset(data['username'], data['code'],
                                              data['password'], source='Portal_SD2E')
        except Exception as e:
            if len(e.args) > 1:
                if re.search('account does not match', e.args[1]):
                    form.add_error('username', e.args[1])
                elif re.search('No password reset request matches', e.args[1]):
                    form.add_error('code', e.args[1])
                elif re.search('complexity requirements', e.args[1]):
                    form.add_error('password', e.args[1])
                elif re.search('expired', e.args[1]):
                    form.add_error('code', e.args[1])
                else:
                    logger.exception('Password reset failed')
                    form.add_error('__all__', 'An unexpected error occurred. '
                                              'Please try again')
            else:
                form.add_error('__all__', 'An unexpected error occurred. '
                                          'Please try again')

    return False


def email_confirmation(request, code=None):
    context = {}
    if request.method == 'POST':
        form = forms.EmailConfirmationForm(request.POST)
        if form.is_valid():
            data = form.cleaned_data
            code = data['code']
            username = data['username']
            password = data['password']
            try:
                tas = TASClient()
                user = tas.get_user(username=username)
                if tas.verify_user(user['id'], code, password=password):
                    check_or_create_agave_home_dir.apply_async(args=(user["username"],))

                    messages.success(request,
                                     'Congratulations, your account has been activated! '
                                     'You can now log in to DesignSafe.')
                    return HttpResponseRedirect(
                        reverse('portal_accounts:manage_profile'))
                else:
                    messages.error(request,
                                   'We were unable to activate your account. Please try '
                                   'again. If this problem persists, please '
                                   '<a href="/help">open a support ticket</a>.')
                    form = forms.EmailConfirmationForm(
                        initial={'code': code, 'username': username})
            except:
                logger.exception('TAS Account activation failed')
                form.add_error('__all__',
                               'Account activation failed. Please confirm your '
                               'activation code, username and password and try '
                               'again.')
    else:
        if code is None:
            code = request.GET.get('code', '')
        form = forms.EmailConfirmationForm(initial={'code': code})

    context['form'] = form

    return render(request, 'portal/apps/accounts/email_confirmation.html', context)


def departments_json(request):
    institution_id = request.GET.get('institutionId')
    if institution_id:
        tas = TASClient()
        departments = tas.get_departments(institution_id)
    else:
        departments = {}
    return HttpResponse(json.dumps(departments), content_type='application/json')


# Throws Bad Gateway 502 Error.
#
# @permission_required('portal_accounts.view_notification_subscribers', raise_exception=True)
# def mailing_list_subscription(request, list_name):
#     subscribers = ['"Name","Email"']
#     try:
#         su = get_user_model().objects.filter(
#             Q(notification_preferences__isnull=True) |
#             Q(**{"notification_preferences__{}".format(list_name): True}))
#         subscribers += list('"{0}","{1}"'.format(u.get_full_name().encode('utf-8'), u.email.encode('utf-8')) for u in su)
#     except TypeError as e:
#         logger.warning('Invalid list name: {}'.format(list_name))
#     return HttpResponse('\n'.join(subscribers), content_type='text/csv')
