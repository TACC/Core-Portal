from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views.generic.base import TemplateView


@method_decorator(login_required, name="dispatch")
class IndexView(TemplateView):
    """
    Render the SPA shell for top-level user updates routes.
    """

    template_name = "portal/apps/workbench/index.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["setup_complete"] = self.request.user.profile.setup_complete
        context["DEBUG"] = settings.DEBUG
        return context
