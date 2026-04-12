from django.contrib.auth.models import AbstractUser
from django.db import models
import random
import string


class User(AbstractUser):
    """Custom User model with RBAC roles"""

    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('user', 'User'),
        ('guest', 'Guest'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    bio = models.TextField(blank=True)

    class Meta:
        permissions = [
            ("can_manage_users", "Can manage users"),
            ("can_view_users", "Can view users"),
            ("can_edit_users", "Can edit users"),
            ("can_delete_users", "Can delete users"),
            ("can_manage_roles", "Can manage roles"),
        ]

    def __str__(self):
        return self.email or self.username

    @property
    def is_admin(self):
        return self.role == 'admin' or self.is_superuser

    @property
    def is_guest(self):
        return self.role == 'guest'

    def has_permission(self, permission):
        """Check if user has specific permission"""
        if self.is_superuser or self.is_staff:
            return True
        return self.has_perm(f"accounts.{permission}")


class UserPermission(models.Model):
    """Store custom permissions for users"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='permissions')
    permission = models.CharField(max_length=100)
    granted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'permission']


class OTP(models.Model):
    """OTP verification for user registration"""
    email = models.EmailField()
    code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=20, default='registration')  # registration, password_reset
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    @staticmethod
    def generate_code():
        """Generate a 6-digit OTP code"""
        return ''.join(random.choices(string.digits, k=6))

    def is_valid(self):
        """Check if OTP is still valid"""
        from django.utils import timezone
        return not self.is_used and timezone.now() < self.expires_at