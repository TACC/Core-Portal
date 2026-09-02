import logging
from django.http import JsonResponse
from portal.apps.notifications.models import Notification

from portal.views.base import BaseApiView

import json

logger = logging.getLogger(__name__)


class ManageNotificationsView(BaseApiView):

    def get(self, request, *args, **kwargs):
        """List all notifications of a certain event type.
        """
        limit = request.GET.get('limit', 0)
        page = request.GET.get('page', 0)
        read = request.GET.get('read')
        event_types = request.GET.getlist('eventTypes')

        query_params = {}
        if read is not None:
            query_params['read'] = read

        if event_types:
            notifs = Notification.objects.filter(event_type__in=event_types,
                                                 deleted=False,
                                                 user=request.user.username,
                                                 **query_params).order_by('-datetime')
            total = Notification.objects.filter(event_type__in=event_types,
                                                deleted=False,
                                                user=request.user.username).count()
            unread = Notification.objects.filter(event_type__in=event_types,
                                                 deleted=False,
                                                 read=False,
                                                 user=request.user.username).count()
        else:
            notifs = Notification.objects.filter(deleted=False,
                                                 user=request.user.username,
                                                 **query_params).order_by('-datetime')
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

    def patch(self, request, *args, **kwargs):
        """Mark notifications as read.
        """
        body = json.loads(request.body)
        nid = body.get('id')
        read = body.get('read', True)
        event_types = body.get('eventTypes')

        if nid == 'all' and read is True:
            if event_types is not None:
                notifs = Notification.objects.filter(deleted=False,
                                                     read=False,
                                                     event_type__in=event_types,
                                                     user=request.user.username)
            else:
                notifs = Notification.objects.filter(deleted=False,
                                                     read=False,
                                                     user=request.user.username)
            for n in notifs:
                n.mark_read()
        else:
            n = Notification.get(id=nid)
            n.read = read
            n.save()

        return JsonResponse({'message': 'OK'})

    def delete(self, request, pk, *args, **kwargs):
        """Mark notifications as deleted.
        """
        if pk == 'all':
            items = Notification.objects.filter(deleted=False, user=request.user.username)
            for i in items:
                i.mark_deleted()
        else:
            x = Notification.objects.get(pk=pk)
            x.mark_deleted()

        return JsonResponse({'message': 'OK'})
