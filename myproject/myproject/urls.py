from django.contrib import admin
from django.urls import path, include
from accounts import views

urlpatterns = [
    path('admin/', admin.site.urls),
    # Auth endpoints
    path('api/auth/register/', views.RegisterView.as_view(), name='register'),
    path('api/auth/login/', views.LoginView.as_view(), name='login'),
    path('api/auth/logout/', views.LogoutView.as_view(), name='logout'),
    # OTP endpoints
    path('api/auth/otp/send/', views.SendOTPView.as_view(), name='otp-send'),
    path('api/auth/otp/verify/', views.VerifyOTPView.as_view(), name='otp-verify'),
    # RBAC endpoints (must be before <pk> routes)
    path('api/users/me/', views.current_user, name='current-user'),
    path('api/users/me/update/', views.update_current_user, name='update-current-user'),
    path('api/users/me/change-password/', views.change_password, name='change-password'),
    path('api/users/permissions/', views.user_permissions, name='user-permissions'),
    path('api/users/role/update/', views.update_user_role, name='update-user-role'),
    path('api/users/toggle-active/', views.toggle_user_active, name='toggle-user-active'),
    path('api/users/create/', views.UserCreateView.as_view(), name='user-create'),
    # User endpoints
    path('api/users/', views.UserListView.as_view(), name='user-list'),
    path('api/users/<str:pk>/', views.UserDetailView.as_view(), name='user-detail'),
]