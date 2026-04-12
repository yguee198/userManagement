from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('otp/send/', views.SendOTPView.as_view(), name='otp-send'),
    path('otp/verify/', views.VerifyOTPView.as_view(), name='otp-verify'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('users/', views.UserListView.as_view(), name='user-list'),
    path('users/create/', views.UserCreateView.as_view(), name='user-create'),
    path('users/me/', views.current_user, name='current-user'),
    path('users/me/update/', views.update_current_user, name='update-current-user'),
    path('users/me/change-password/', views.change_password, name='change-password'),
    path('users/<str:pk>/', views.UserDetailView.as_view(), name='user-detail'),
]