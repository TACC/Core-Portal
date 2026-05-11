from django.urls import path

from portal.apps.news.views import IndexView

app_name = 'news'
urlpatterns = [
    path('', IndexView.as_view(), name='index'),
    path('<str:id>/', IndexView.as_view(), name='detail'),
]
