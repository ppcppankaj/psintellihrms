"""
Organization Middleware - Production Ready Multi-Tenancy Implementation

CRITICAL:
- Async-safe (contextvars)
- Migration-safe
- Oracle VM / Docker safe
- PostgreSQL RLS compatible
"""

import sys
import logging
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings
from django.db import connection

logger = logging.getLogger(__name__)

# ----------------------------------------------------------------------
# Utilities
# ----------------------------------------------------------------------

COMMANDS_TO_SKIP = {
    'makemigrations',
    'migrate',
    'shell',
    'createsuperuser',
    'collectstatic',
    'check',
    'loaddata',
    'dumpdata',
    'flush',
    'test',
}


def is_management_command():
    return any(cmd in sys.argv for cmd in COMMANDS_TO_SKIP)


def is_public_path(path: str) -> bool:
    """
    Strict public-path matcher (prevents security bypass).
    """
    PUBLIC_PATHS = (
        '/api/docs',
        '/api/redoc',
        '/api/schema',
        '/api/health',
        '/admin',
        '/static',
        '/media',
    )
    return any(
        path == p or path.startswith(p + '/')
        for p in PUBLIC_PATHS
    )


def log_superuser_org_switch(user, organization, request=None):
    """
    Audit log when a superuser switches organization context.
    """
    logger.warning(
        "superuser_org_switch",
        extra={
            'event': 'superuser_org_switch',
            'user_id': str(user.id),
            'user_email': user.email,
            'organization_id': str(organization.id),
            'organization_name': organization.name,
            'ip_address': request.META.get('REMOTE_ADDR') if request else None,
        }
    )


# ----------------------------------------------------------------------
# Middleware
# ----------------------------------------------------------------------

class OrganizationMiddleware(MiddlewareMixin):
    """
    Resolves and enforces organization context.

    MUST run AFTER AuthenticationMiddleware.
    """

    def process_request(self, request):
        from apps.core.context import (
            set_current_organization,
            set_current_user,
            clear_context,
        )

        # Always start clean (async-safe)
        clear_context()
        request.organization = None

        # ------------------------------------------------------------------
        # Skip management commands (CRITICAL for migrations)
        # ------------------------------------------------------------------
        if is_management_command():
            logger.debug("OrganizationMiddleware skipped for management command")
            return None

        # ------------------------------------------------------------------
        # Skip public paths
        # ------------------------------------------------------------------
        if is_public_path(request.path):
            logger.debug("OrganizationMiddleware skipped public path: %s", request.path)
            return None

        # ------------------------------------------------------------------
        # Skip unauthenticated users
        # ------------------------------------------------------------------
        if not getattr(request, 'user', None) or not request.user.is_authenticated:
            logger.debug("OrganizationMiddleware unauthenticated request")
            return None

        # ------------------------------------------------------------------
        # Set user context
        # ------------------------------------------------------------------
        set_current_user(request.user)
        logger.debug("Authenticated user: %s", request.user.email)

        from apps.core.models import Organization

        # ------------------------------------------------------------------
        # User has organization
        # ------------------------------------------------------------------
        if getattr(request.user, 'organization', None):
            org = request.user.organization

            if not org.is_active:
                logger.warning(
                    "inactive_organization_access",
                    extra={
                        'event': 'inactive_organization_access',
                        'user_id': str(request.user.id),
                        'organization_id': str(org.id),
                    }
                )
                return JsonResponse(
                    {'error': 'Organization is inactive', 'code': 'ORG_INACTIVE'},
                    status=403,
                )

            if org.subscription_status in {'suspended', 'cancelled'}:
                logger.warning(
                    "inactive_subscription_access",
                    extra={
                        'event': 'inactive_subscription_access',
                        'user_id': str(request.user.id),
                        'organization_id': str(org.id),
                        'subscription_status': org.subscription_status,
                    }
                )
                return JsonResponse(
                    {
                        'error': 'Organization subscription inactive',
                        'subscription_status': org.subscription_status,
                        'code': 'SUBSCRIPTION_INACTIVE',
                    },
                    status=403,
                )

            set_current_organization(org)
            request.organization = org

            # PostgreSQL RLS support
            if getattr(settings, 'ENABLE_POSTGRESQL_RLS', False):
                try:
                    with connection.cursor() as cursor:
                        cursor.execute(
                            "SET LOCAL app.current_organization_id = %s",
                            [str(org.id)],
                        )
                except Exception:
                    logger.exception("Failed to set PostgreSQL RLS context")

            return None

        # ------------------------------------------------------------------
        # Superuser without organization
        # ------------------------------------------------------------------
        if request.user.is_superuser:
            org_id = (
                request.headers.get('X-Organization-ID')
                or request.headers.get('X-Tenant-Id')
            )

            if org_id:
                try:
                    org = Organization.objects.get(id=org_id, is_active=True)

                    log_superuser_org_switch(request.user, org, request)

                    set_current_organization(org)
                    request.organization = org

                    if getattr(settings, 'ENABLE_POSTGRESQL_RLS', False):
                        try:
                            with connection.cursor() as cursor:
                                cursor.execute(
                                    "SET LOCAL app.current_organization_id = %s",
                                    [str(org.id)],
                                )
                        except Exception:
                            logger.exception("Failed to set RLS for superuser")

                except Organization.DoesNotExist:
                    logger.warning(
                        "invalid_org_switch",
                        extra={
                            'event': 'invalid_org_switch',
                            'user_id': str(request.user.id),
                            'organization_id': org_id,
                        }
                    )
                    return JsonResponse(
                        {'error': 'Invalid organization ID', 'code': 'INVALID_ORG'},
                        status=400,
                    )

            # Superuser allowed without org
            return None

        # ------------------------------------------------------------------
        # Regular user without organization (BLOCK)
        # ------------------------------------------------------------------
        logger.warning(
            "user_without_organization",
            extra={
                'event': 'user_without_organization',
                'user_id': str(request.user.id),
            }
        )
        return JsonResponse(
            {'error': 'User has no organization', 'code': 'NO_ORG'},
            status=403,
        )

    # ------------------------------------------------------------------
    # Cleanup (async-safe)
    # ------------------------------------------------------------------

    def process_response(self, request, response):
        from apps.core.context import clear_context
        clear_context()
        return response

    def process_exception(self, request, exception):
        from apps.core.context import clear_context
        clear_context()
        return None
