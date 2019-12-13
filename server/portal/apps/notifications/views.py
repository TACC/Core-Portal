import logging
from django.http import HttpResponse, JsonResponse
from portal.apps.notifications.models import Notification

from portal.views.base import BaseApiView

import json

logger = logging.getLogger(__name__)


class ManageNotificationsView(BaseApiView):

    def get(self, request, event_type=None, *args, **kwargs):
        limit = request.GET.get('limit', 0)
        page = request.GET.get('page', 0)

        if event_type is not None:
            notifs = Notification.objects.filter(event_type=event_type,
                                                 deleted=False,
                                                 user=request.user.username).order_by('-datetime')
            total = Notification.objects.filter(event_type=event_type,
                                                deleted=False,
                                                user=request.user.username).count()
            unread = Notification.objects.filter(event_type=event_type,
                                                 deleted=False,
                                                 read=False,
                                                 user=request.user.username).count()
        else:
            notifs = Notification.objects.filter(deleted=False,
                                                 user=request.user.username).order_by('-datetime')
            total = Notification.objects.filter(deleted=False,
                                                user=request.user.username).count()
            unread = Notification.objects.filter(deleted=False,
                                                 read=False,
                                                 user=request.user.username).count()
        if limit:
            limit = int(limit)
            page = int(page)
            offset = page * limit
            notifs = notifs[offset:offset+limit]

        notifs = [n.to_dict() for n in notifs]
        return JsonResponse({'notifs': notifs, 'page': page, 'total': total, 'unread': unread})

    def post(self, request, *args, **kwargs):
        body_json = json.loads(request.body)
        nid = body_json['id']
        read = body_json['read']

        if nid == 'all' and read is True:
            notifs = Notification.objects.filter(deleted=False,
                                                 user=request.user.username)
            for n in notifs:
                if not n.read:
                    n.mark_read()
        else:
            n = Notification.get(id=nid)
            n.read = read
            n.save()

        return HttpResponse('OK')

    def delete(self, request, pk, *args, **kwargs):
        if pk == 'all':
            items = Notification.objects.filter(deleted=False, user=str(request.user))
            for i in items:
                i.mark_deleted()
        else:
            x = Notification.objects.get(pk=pk)
            x.mark_deleted()

        return HttpResponse('OK')


class NotificationsBadgeView(BaseApiView):

    def get(self, request, *args, **kwargs):
        unread = Notification.objects.filter(deleted=False, read=False,
                                             user=request.user.username).count()
        return self.render_to_json_response({'unread': unread})
