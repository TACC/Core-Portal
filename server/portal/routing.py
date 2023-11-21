# from channels.auth import AuthMiddlewareStack
# from channels.routing import ProtocolTypeRouter, URLRouter
# import portal.apps.notifications.routing

# application = ProtocolTypeRouter({
#     # (http->django views is added by default)
#     'websocket': AuthMiddlewareStack(
#         URLRouter(
#             portal.apps.notifications.routing.websocket_urlpatterns
#         )
#     ),
# })
