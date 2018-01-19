from django.conf.urls import url
from portal.apps.workshops import views

urlpatterns = [
    url(r'^(?P<workshop_id>[0-9]+)/login', views.workshop_authentication, name="workshop_authentication"),
    url(r'^(?P<workshop_id>[0-9]+)', views.workshop, name="workshop"),

]
