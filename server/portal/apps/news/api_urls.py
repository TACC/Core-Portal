from django.urls import path

from portal.apps.news.views import UserNewsView

app_name = 'news_api'
urlpatterns = [
    path('', UserNewsView.as_view(), name='list'),
]
