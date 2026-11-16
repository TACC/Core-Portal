import json
import logging
import os
from unittest import skip

import pytest
from django.contrib.auth import get_user_model
from django.test import Client, TestCase
from django.urls import reverse

from .models import Notification

logger = logging.getLogger(__name__)

FILEDIR_PENDING = os.path.join(os.path.dirname(__file__), "./json/pending.json")
FILEDIR_SUBMITTING = os.path.join(os.path.dirname(__file__), "./json/submitting.json")
FILEDIR_PENDING2 = os.path.join(os.path.dirname(__file__), "./json/pending2.json")

with open(FILEDIR_PENDING) as f:
    webhook_body_pending = json.dumps(json.load(f))
with open(FILEDIR_PENDING2) as f:
    webhook_body_pending2 = json.dumps(json.load(f))
with open(FILEDIR_SUBMITTING) as f:
    webhook_body_submitting = json.dumps(json.load(f))


User = get_user_model()
wh_url = reverse("webhooks:jobs_wh_handler")


@pytest.fixture
def user1(db):
    """Create first test user."""
    return User.objects.create_user(username="testuser1", password="testpass123", email="user1@example.com")


@pytest.fixture
def user2(db):
    """Create second test user."""
    return User.objects.create_user(username="testuser2", password="testpass123", email="user2@example.com")


@pytest.fixture
def create_notification():
    """Factory fixture to create notifications."""

    def _create(user, message="Test notification"):
        return Notification.objects.create(
            user=user.username,
            event_type="TEST",
            status="INFO",
            message=message,
            read=False,
            deleted=False,
        )

    return _create


@pytest.mark.django_db
class TestManageNotificationsViewDelete:
    """Test suite for ManageNotificationsView.delete method."""

    def test_delete_requires_login(self, client, user1, create_notification):
        """Test that unauthenticated users cannot delete notifications."""
        notification = create_notification(user1)
        url = reverse("notifications:event_type_notifications", kwargs={"pk": notification.pk})

        response = client.delete(url)

        assert response.status_code == 401
        assert response["Content-Type"] == "application/json"
        assert json.loads(response.content) == {"message": "Authentication required"}
        notification.refresh_from_db()
        assert notification.deleted is False

    def test_get_requires_login(self, client, user1, create_notification):
        """Test that unauthenticated users get a JSON 401 when listing notifications."""
        create_notification(user1)
        url = reverse("notifications:event_type_notifications")

        response = client.get(url)

        assert response.status_code == 401
        assert json.loads(response.content) == {"message": "Authentication required"}

    def test_patch_requires_login(self, client, user1, create_notification):
        """Test that unauthenticated users cannot mark notifications as read."""
        notification = create_notification(user1)
        url = reverse("notifications:event_type_notifications")

        response = client.patch(url, json.dumps({"id": notification.pk}), content_type="application/json")

        assert response.status_code == 401
        assert json.loads(response.content) == {"message": "Authentication required"}
        notification.refresh_from_db()
        assert notification.read is False

    def test_delete_single_notification_by_authenticated_user(self, client, user1, create_notification):
        """Test that an authenticated user can delete their own notification."""
        notification = create_notification(user1)
        client.login(username="testuser1", password="testpass123")
        url = reverse("notifications:event_type_notifications", kwargs={"pk": notification.pk})

        response = client.delete(url)

        assert response.status_code == 200
        data = json.loads(response.content)
        assert data["message"] == "OK"
        notification.refresh_from_db()
        assert notification.deleted is True

    def test_user_cannot_delete_another_users_notification(self, client, user1, user2, create_notification):
        """Test that a user cannot delete another user's notification."""
        notification = create_notification(user2)
        client.login(username="testuser1", password="testpass123")
        url = reverse("notifications:event_type_notifications", kwargs={"pk": notification.pk})

        response = client.delete(url)

        assert response.status_code == 500
        notification.refresh_from_db()
        assert notification.deleted is False

    def test_delete_all_notifications_authenticated_user(self, client, user1, create_notification):
        """Test that an authenticated user can delete all their notifications."""
        create_notification(user1, "Notification 1")
        create_notification(user1, "Notification 2")
        create_notification(user1, "Notification 3")
        client.login(username="testuser1", password="testpass123")
        url = reverse("notifications:event_type_notifications", kwargs={"pk": "all"})

        response = client.delete(url)

        assert response.status_code == 200
        data = json.loads(response.content)
        assert data["message"] == "OK"
        deleted_count = Notification.objects.filter(user=user1.username, deleted=True).count()
        assert deleted_count == 3

    def test_delete_all_only_affects_logged_in_user(self, client, user1, user2, create_notification):
        """Test that delete 'all' only affects the logged-in user's notifications."""
        user1_notif1 = create_notification(user1, "User1 Notif 1")
        user1_notif2 = create_notification(user1, "User1 Notif 2")
        user2_notif1 = create_notification(user2, "User2 Notif 1")
        user2_notif2 = create_notification(user2, "User2 Notif 2")

        client.login(username="testuser1", password="testpass123")
        url = reverse("notifications:event_type_notifications", kwargs={"pk": "all"})

        response = client.delete(url)

        assert response.status_code == 200

        user1_notif1.refresh_from_db()
        user1_notif2.refresh_from_db()
        user2_notif1.refresh_from_db()
        user2_notif2.refresh_from_db()

        assert user1_notif1.deleted is True
        assert user1_notif2.deleted is True
        assert user2_notif1.deleted is False
        assert user2_notif2.deleted is False

    def test_delete_already_deleted_notification(self, client, user1, create_notification):
        """Test that deleting an already-deleted notification is a no-op."""
        notification = create_notification(user1)
        notification.mark_deleted()

        client.login(username="testuser1", password="testpass123")
        url = reverse("notifications:event_type_notifications", kwargs={"pk": notification.pk})

        response = client.delete(url)

        assert response.status_code == 200
        notification.refresh_from_db()
        assert notification.deleted is True

    def test_delete_nonexistent_notification_returns_500(self, client, user1):
        """Test that deleting a non-existent notification returns a 500 error."""
        client.login(username="testuser1", password="testpass123")
        url = reverse("notifications:event_type_notifications", kwargs={"pk": 99999})

        response = client.delete(url)

        assert response.status_code == 500


@skip("Need to mock websocket call to redis")
class NotificationsTestCase(TestCase):
    fixtures = ["user-data.json", "agave-oauth-token-data.json"]

    def setUp(self):
        user = get_user_model().objects.get(pk=2)
        user.set_password("password")
        user.save()
        self.user = user
        self.client = Client()

        with open("designsafe/apps/api/fixtures/agave-model-config-meta.json") as f:
            model_config_meta = json.load(f)
        self.model_config_meta = model_config_meta

        with open("designsafe/apps/api/fixtures/agave-file-meta.json") as f:
            file_meta = json.load(f)
        self.file_meta = file_meta

        with open("designsafe/apps/api/fixtures/agave-experiment-meta.json") as f:
            experiment_meta = json.load(f)
        self.experiment_meta = experiment_meta

        with open("designsafe/apps/api/fixtures/agave-project-meta.json") as f:
            project_meta = json.load(f)
        self.project_meta = project_meta

    def test_current_user_is_ds_user(self):
        """
        just making sure the db setup worked.
        """
        self.assertEqual(self.user.username, "ds_user")

    def test_submitting_webhook_returns_200_and_creates_notification(self):
        r = self.client.post(wh_url, webhook_body_pending, content_type="application/json")
        self.assertEqual(r.status_code, 200)
        n = Notification.objects.last()
        status_from_notification = n.to_dict()["extra"]["status"]
        self.assertEqual(status_from_notification, "PENDING")

    def test_2_webhooks_same_status_same_jobId_should_give_1_notification(self):
        self.client.post(wh_url, webhook_body_pending, content_type="application/json")

        # assert that sending the same status twice doesn't trigger a second notification.
        self.client.post(wh_url, webhook_body_pending, content_type="application/json")
        self.assertEqual(Notification.objects.count(), 1)

    def test_2_webhooks_different_status_same_jobId_should_give_2_notifications(self):
        self.client.post(wh_url, webhook_body_pending, content_type="application/json")

        self.client.post(wh_url, webhook_body_submitting, content_type="application/json")
        self.assertEqual(Notification.objects.count(), 2)

    def test_2_webhooks_same_status_different_jobId_should_give_2_notifications(self):

        self.client.post(wh_url, webhook_body_pending, content_type="application/json")
        self.client.post(wh_url, webhook_body_pending2, content_type="application/json")

        self.assertEqual(Notification.objects.count(), 2)
