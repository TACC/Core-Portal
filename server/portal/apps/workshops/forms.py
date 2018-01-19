from django import forms

class WorkshopAuthForm(forms.Form):

    access_code = forms.CharField(
        label='Enter Your Registration Code',
        required=True,
        error_messages={
            'required': 'Please enter the registration code you received via email.'
        })
