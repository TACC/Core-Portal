from django import forms
from django.core.validators import validate_email

# This was pulled from : https://docs.djangoproject.com/en/1.7/ref/forms/validation/
class MultiEmailField(forms.Field):
    def to_python(self, value):
        "Normalize data to a list of strings."

        # Return an empty list if no input was given.
        if not value:
            return []
        return value.split(',')

    def validate(self, value):
        "Check if value consists only of valid emails."

        # Use the parent's handling of required fields, etc.
        super(MultiEmailField, self).validate(value)

        for email in value:
            validate_email(email.strip())

class TicketForm(forms.Form):
    first_name = forms.CharField(label='First name')
    last_name = forms.CharField(label='Last name')
    email = forms.EmailField(label='Email')
    cc = MultiEmailField(widget=forms.EmailInput(), required=False, help_text='Multiple emails should be comma-separated')
    subject = forms.CharField(label='Subject')
    problem_description = forms.CharField(widget=forms.Textarea())
    metadata = forms.CharField(widget=forms.HiddenInput())

class ReplyForm(forms.Form):
    reply = forms.CharField(widget=forms.Textarea(), label="")

