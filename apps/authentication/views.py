"""
Authentication Views
"""

import secrets
import pyotp
import qrcode
import io
import base64
from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from django.core.exceptions import PermissionDenied

from rest_framework import status, views, viewsets, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes, action

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from apps.authentication.services.emails import send_password_reset_email

from .models import User, UserSession, PasswordResetToken
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserSerializer,
    UserCreateSerializer,
    UserOrgAdminCreateSerializer,
    UserSelfProfileSerializer,
    PasswordChangeSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    TwoFactorEnableSerializer,
    TwoFactorVerifySerializer,
    UserSessionSerializer,
)
# from apps.core.org_permissions import IsOrgAdminOrSuperuser
# from apps.core.tenant_guards import OrganizationViewSetMixin


# =====================================================
# LOGIN
# =====================================================

print("[Login Debug] authentication.views loaded", flush=True)

class SimpleUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'is_superuser']

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    🔒 SECURITY-HARDENED LOGIN
    """
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            email = request.data.get("email")
            try:
                user = User.objects.get(email=email)
                
                # 🔒 Enforce org binding
                if not user.is_superuser and not user.organization_id:
                    from django.core.exceptions import PermissionDenied
                    raise PermissionDenied("User is not assigned to an organization")

                user.record_login_attempt(
                    success=True,
                    ip_address=self.get_client_ip(request),
                    device=request.META.get("HTTP_USER_AGENT", "")
                )

                self.create_session(
                    request,
                    user,
                    response.data.get("refresh")
                )
            except User.DoesNotExist:
                pass

        return response

    def get_client_ip(self, request):
        xff = request.META.get("HTTP_X_FORWARDED_FOR")
        if xff:
            return xff.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR")

    def create_session(self, request, user, refresh_token):
        user_agent = request.META.get("HTTP_USER_AGENT", "")

        UserSession.objects.create(
            user=user,
            session_key=secrets.token_urlsafe(32),
            refresh_token=refresh_token,
            ip_address=self.get_client_ip(request),
            user_agent=user_agent,
            device_type=self.detect_device_type(user_agent),
            expires_at=timezone.now() + timedelta(days=7),
        )

    def detect_device_type(self, user_agent):
        ua = user_agent.lower()
        if any(x in ua for x in ["mobile", "android", "iphone"]):
            return "mobile"
        if any(x in ua for x in ["tablet", "ipad"]):
            return "tablet"
        return "desktop"


# =====================================================
# LOGOUT
# =====================================================

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh_token")

        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except Exception:
                pass

            UserSession.objects.filter(
                user=request.user,
                refresh_token=refresh_token,
            ).update(is_active=False)

        return Response({"success": True})


# =====================================================
# PROFILE
# =====================================================

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSelfProfileSerializer(request.user)
        return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """
    🔒 User profile with tenant context
    """
    user = request.user
    serializer = UserSerializer(user)
    return Response(serializer.data)


# =====================================================
# PASSWORD MANAGEMENT
# =====================================================

class PasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(
            data=request.data,
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"success": True})


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"success": True})


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"success": True})


# =====================================================
# TWO FACTOR AUTH (2FA)
# =====================================================

class TwoFactorEnableView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = TwoFactorEnableSerializer(
            data=request.data,
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        data = serializer.save()
        return Response(data)


class TwoFactorVerifyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = TwoFactorVerifySerializer(
            data=request.data,
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"success": True})


class TwoFactorDisableView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.disable_2fa()
        return Response({"success": True})


# =====================================================
# USER SESSIONS
# =====================================================

class SessionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = UserSession.objects.filter(
            user=request.user,
            is_active=True
        )
        serializer = UserSessionSerializer(qs, many=True)
        return Response(serializer.data)

    def delete(self, request, session_id=None):
        UserSession.objects.filter(
            id=session_id,
            user=request.user
        ).update(is_active=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


# =====================================================
# USER MANAGEMENT (ORG ADMIN)
# =====================================================

class UserManagementViewSet(viewsets.ModelViewSet):
    """
    🔒 Tenant-safe user management
    """
    queryset = User.objects.none()
    # permission_classes = [IsAuthenticated, IsOrgAdminOrSuperuser]
    permission_classes = [IsAuthenticated]

    def check_permissions(self, request):
        super().check_permissions(request)
        from apps.core.org_permissions import IsOrgAdminOrSuperuser
        permission = IsOrgAdminOrSuperuser()
        if not permission.has_permission(request, self):
            self.permission_denied(request, message=getattr(permission, 'message', None))

    def get_queryset(self):
        user = self.request.user

        if user.is_superuser:
            return User.objects.filter()

        if user.is_org_admin and user.organization_id:
            return User.objects.filter(organization_id=user.organization_id)

        return User.objects.none()

    def get_serializer_class(self):
        if self.action == "create":
            return UserOrgAdminCreateSerializer
        return UserSerializer

    def create(self, request, *args, **kwargs):
        if not request.user.is_org_admin and not request.user.is_superuser:
            raise PermissionDenied("Only org admins can create users")
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        target_user = self.get_object()

        if target_user == request.user and request.user.is_org_admin:
            raise PermissionDenied("Organization admins cannot modify their own account")

        if "organization_id" in request.data and not request.user.is_superuser:
            raise PermissionDenied("Only superusers can change organization")

        if any(
            f in request.data
            for f in ["is_org_admin", "is_staff", "is_superuser"]
        ):
            if not request.user.is_superuser:
                raise PermissionDenied(
                    "Only superusers can modify privilege levels"
                )

        return super().update(request, *args, **kwargs)


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user = get_user_somehow()
        reset_url = build_reset_url(user)

        send_password_reset_email(user, reset_url)

        return Response(
            {"detail": "Password reset email sent"},
            status=200
        )