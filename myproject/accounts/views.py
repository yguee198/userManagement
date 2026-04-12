from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

from .serializers import (
    UserSerializer, RegisterSerializer, LoginSerializer,
    UserCreateSerializer, RoleUpdateSerializer, OTPSerializer, OTPVerifySerializer
)
from .models import OTP
from django.core.mail import send_mail
from django.conf import settings


class IsAdminUser(permissions.BasePermission):
    """Custom permission to only allow admin users"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin


class CanManageUsers(permissions.BasePermission):
    """Custom permission to check if user can manage users"""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser or request.user.is_staff:
            return True
        return request.user.role == 'admin'


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        user.last_login = timezone.now()
        user.save()

        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        })


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        return Response({'message': 'Successfully logged out'})


class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Only admins can see all users, regular users can only see themselves
        if user.is_admin or user.is_superuser:
            return User.objects.all()
        return User.objects.filter(id=user.id)


class UserCreateView(generics.CreateAPIView):
    serializer_class = UserCreateSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageUsers]


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return User.objects.all()

    def get_object(self):
        pk = self.kwargs.get('pk')
        if pk == 'me':
            return self.request.user
        try:
            return User.objects.get(pk=pk)
        except User.DoesNotExist:
            return None

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance == request.user:
            return Response(
                {'error': 'Cannot delete your own account'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not request.user.is_admin:
            return Response(
                {'error': 'Only admins can delete users'},
                status=status.HTTP_403_FORBIDDEN
            )
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def current_user(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_current_user(request):
    # Users can only update their own profile (except role and is_staff)
    serializer = UserSerializer(request.user, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)

    # Prevent regular users from changing their role or staff status
    if not request.user.is_admin:
        serializer.validated_data.pop('role', None)
        serializer.validated_data.pop('is_staff', None)

    serializer.save()
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    user = request.user
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    new_password_confirm = request.data.get('new_password_confirm')

    if not user.check_password(old_password):
        return Response({'error': 'Old password is incorrect'},
                       status=status.HTTP_400_BAD_REQUEST)

    if new_password != new_password_confirm:
        return Response({'error': 'New passwords do not match'},
                       status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()
    return Response({'message': 'Password changed successfully'})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsAdminUser])
def update_user_role(request):
    """Admin only: Update a user's role"""
    serializer = RoleUpdateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        user = User.objects.get(pk=serializer.validated_data['user_id'])
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    # Prevent changing own role
    if user == request.user:
        return Response({'error': 'Cannot change your own role'},
                       status=status.HTTP_400_BAD_REQUEST)

    user.role = serializer.validated_data['role']
    user.save()

    return Response({
        'message': f'User role updated to {user.role}',
        'user': UserSerializer(user).data
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsAdminUser])
def user_permissions(request):
    """Get all available permissions and user's current permissions"""
    permissions_list = [
        {'name': 'can_manage_users', 'description': 'Can manage all users'},
        {'name': 'can_view_users', 'description': 'Can view user list'},
        {'name': 'can_edit_users', 'description': 'Can edit user profiles'},
        {'name': 'can_delete_users', 'description': 'Can delete users'},
        {'name': 'can_manage_roles', 'description': 'Can manage user roles'},
    ]

    user_perms = []
    if request.user.is_superuser or request.user.is_staff:
        user_perms = [p['name'] for p in permissions_list]
    elif request.user.role == 'admin':
        user_perms = ['can_manage_users', 'can_view_users', 'can_edit_users', 'can_delete_users']
    elif request.user.role == 'user':
        user_perms = ['can_view_users']

    return Response({
        'all_permissions': permissions_list,
        'user_permissions': user_perms,
        'role': request.user.role
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsAdminUser])
def toggle_user_active(request):
    """Admin only: Toggle user active status"""
    user_id = request.data.get('user_id')
    is_active = request.data.get('is_active')

    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    if user == request.user:
        return Response({'error': 'Cannot change your own status'},
                       status=status.HTTP_400_BAD_REQUEST)

    user.is_active = is_active
    user.save()

    return Response({
        'message': f'User {"activated" if is_active else "deactivated"}',
        'user': UserSerializer(user).data
    })


class SendOTPView(APIView):
    """Send OTP to user's email for verification"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = OTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        # Check if user already exists
        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'Email already registered'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generate and save OTP
        otp = OTP.objects.create(
            email=email,
            code=OTP.generate_code(),
            purpose='registration',
            expires_at=timezone.now() + timezone.timedelta(minutes=10)
        )

        # Send email
        try:
            send_mail(
                subject='Your Verification Code',
                message=f'Your verification code is: {otp.code}\n\nThis code expires in 10 minutes.',
                from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@example.com',
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to send email: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response({'message': 'Verification code sent to your email'})


class VerifyOTPView(APIView):
    """Verify OTP and create user"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        code = serializer.validated_data['code']

        # Find valid OTP
        try:
            otp = OTP.objects.filter(
                email=email,
                code=code,
                purpose='registration',
                is_used=False
            ).latest('created_at')
        except OTP.DoesNotExist:
            return Response(
                {'error': 'Invalid or expired verification code'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not otp.is_valid():
            return Response(
                {'error': 'Verification code has expired'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Mark OTP as used
        otp.is_used = True
        otp.save()

        # Get pending user data from request and create user
        user_data = request.data.get('user_data', {})
        password = user_data.get('password', '')
        password_confirm = user_data.get('password_confirm', '')

        if password != password_confirm:
            return Response(
                {'error': 'Passwords do not match'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(password) < 8:
            return Response(
                {'error': 'Password must be at least 8 characters'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if username already exists
        username = user_data.get('username', '')
        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create user
        user = User.objects.create_user(
            email=email,
            username=username,
            password=password,
            first_name=user_data.get('first_name', ''),
            last_name=user_data.get('last_name', ''),
            role='user',
            is_active=True
        )

        return Response({
            'message': 'User created successfully',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)