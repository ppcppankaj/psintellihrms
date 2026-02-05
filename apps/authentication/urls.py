"""
Authentication URLs
"""

from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

from .views import (
    CustomTokenObtainPairView, LogoutView, ProfileView,
    PasswordChangeView, PasswordResetRequestView, PasswordResetConfirmView,
    TwoFactorEnableView, TwoFactorVerifyView, TwoFactorDisableView,
    SessionListView, user_profile, UserManagementViewSet
)
from .views_branch import BranchSelectorViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register('users', UserManagementViewSet, basename='user-management')

urlpatterns = [
    path('', include(router.urls)),
    # Token management
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # Profile
    path('me/', ProfileView.as_view(), name='profile'),
    path('profile/', user_profile, name='user_profile'),
    
    # Password management
    path('password/change/', PasswordChangeView.as_view(), name='change_password'),
    path('password/reset/', PasswordResetRequestView.as_view(), name='forgot_password'),
    path('password/reset/confirm/', PasswordResetConfirmView.as_view(), name='reset_password'),
    
    # 2FA
    path('2fa/enable/', TwoFactorEnableView.as_view(), name='2fa_enable'),
    path('2fa/verify/', TwoFactorVerifyView.as_view(), name='2fa_verify'),
    path('2fa/disable/', TwoFactorDisableView.as_view(), name='2fa_disable'),
    
    # Sessions
    path('sessions/', SessionListView.as_view(), name='sessions_list'),
    path('sessions/<uuid:session_id>/', SessionListView.as_view(), name='session_delete'),
    
    # Branch Selector
    path('branches/my-branches/', BranchSelectorViewSet.as_view({'get': 'my_branches'}), name='my_branches'),
    path('branches/switch-branch/', BranchSelectorViewSet.as_view({'post': 'switch_branch'}), name='switch_branch'),
    path('branches/current-branch/', BranchSelectorViewSet.as_view({'get': 'current_branch'}), name='current_branch'),
]
