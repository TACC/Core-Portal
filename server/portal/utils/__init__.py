"""Utils for use across multiple apps"""


def get_client_ip(request):
    """Extract an IP address from a Django request object."""
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[-1].strip()
    else:
        ip = request.META.get("REMOTE_ADDR")
    return ip


def check_group_membership(user, group_name):
    """Return whether a user belongs to a Django auth group."""
    if not user or not getattr(user, "is_authenticated", False):
        return False
    return user.groups.filter(name=group_name).exists()
