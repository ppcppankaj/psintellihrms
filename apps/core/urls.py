"""
Core URLs
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuditLogViewSet, FeatureFlagViewSet, OrganizationViewSet

router = DefaultRouter()
router.register(r'organizations', OrganizationViewSet, basename='organization')
router.register('audit-logs', AuditLogViewSet, basename='audit-log')
router.register('feature-flags', FeatureFlagViewSet, basename='feature-flag')

urlpatterns = [
    path('', include(router.urls)),
]
