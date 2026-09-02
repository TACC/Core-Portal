from html import unescape

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.utils.html import strip_tags
import requests

from portal.exceptions.api import ApiException
from portal.views.base import BaseApiView


@method_decorator(login_required, name='dispatch')
class UserNewsView(BaseApiView):
    def get(self, request, *args, **kwargs):
        user_news = self._get_user_news()
        sanitize = request.GET.get('sanitize', 'false').lower()
        should_sanitize = sanitize in ['true']

        if should_sanitize:
            for news_item in user_news:
                news_item['content'] = self._sanitize_news_content(news_item.get('content', ''))
                for update in news_item.get('updates', []):
                    update['content'] = self._sanitize_news_content(update.get('content', ''))

        return JsonResponse({"response": user_news, "status": 200})

    def _get_user_news(self):
        auth = requests.auth.HTTPBasicAuth(settings.TAS_CLIENT_KEY, settings.TAS_CLIENT_SECRET)
        r = requests.get('{0}/announcements'.format(settings.TAS_URL), auth=auth)

        resp = r.json()

        if resp.get('status') == 'success':
            return resp.get('result', [])
        raise ApiException('Failed to get announcements', resp.get('message'))

    def _sanitize_news_content(self, content):
        text_content = strip_tags(content or '')
        return unescape(text_content).replace('\xa0', ' ')
