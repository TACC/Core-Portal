"""Date Depot Urls
"""
from django.conf.urls import url
from portal.apps.data_depot import views

urlpatterns = [
    url(r'^', views.DataDepotView.as_view(), name="data_depot"),
]
