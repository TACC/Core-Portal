from django.conf.urls import url
from portal.apps.search import views

urlpatterns = [
    url(r'^', views.SearchIndexView.as_view(), name="search_index"),
]
