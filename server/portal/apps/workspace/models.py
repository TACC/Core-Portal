from django.db import models


class AppTrayCategory(models.Model):
    category = models.CharField(help_text="A category for the app tray", max_length=64)
    priority = models.IntegerField(
        help_text="Category priority, where higher priority tabs appear before lower ones", default=0
    )

    def __str__(self):
        return f"{self.category}"


class AppTrayEntry(models.Model):
    APP_TYPES = [("tapis", "Tapis"), ("html", "HTML")]
    label = models.CharField(help_text="The display name of this app in the App Tray", max_length=64, blank=True)
    icon = models.CharField(help_text="The icon to apply to this application", max_length=64, blank=True)
    version = models.CharField(help_text="The version number of the app", max_length=64, blank=True)
    appId = models.CharField(help_text="The id of this app. The app id + version denotes a unique app", max_length=64)
    appType = models.CharField(help_text="Application type", max_length=10, choices=APP_TYPES, default="tapis")
    html = models.TextField(help_text="HTML definition to display when Application is loaded", default="", blank=True)
    available = models.BooleanField(help_text="App visibility in app tray", default=True)

    category = models.ForeignKey(
        AppTrayCategory, related_name="+", help_text="The App Category for this app entry", on_delete=models.CASCADE
    )

    def __str__(self):
        if self.appType == "html":
            return f"{self.label}: {self.appId} (HTML)"
        return "{}{}{}".format(
            f"{self.label}: " if self.label else "",
            self.appId,
            f"-{self.version}" if self.version else "",
        )
