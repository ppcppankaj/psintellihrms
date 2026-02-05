"""
Organization Middleware - NEW Multi-Tenancy Implementation
Replaces UnifiedTenantMiddleware from schema-based architecture

CRITICAL: Uses contextvars for async safety (not threading.local)
"""

from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from django.db import connection
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def log_superuser_org_switch(user, organization, request=None):
    """
    Audit log when superuser switches organization context.
    Required for compliance and security monitoring.
    """
    from apps.core.models import Organization
    
    logger.warning(
        f"SUPERUSER_ORG_SWITCH: {user.email} (id={user.id}) "
        f"switched to organization {organization.name} (id={organization.id})",
        extra={
            'event': 'superuser_org_switch',
            'user_id': str(user.id),
            'user_email': user.email,
            'organization_id': str(organization.id),
            'organization_name': organization.name,
            'ip_address': request.META.get('REMOTE_ADDR') if request else None,
        }
    )


class OrganizationMiddleware(MiddlewareMixin):
    """
    Sets current organization based on authenticated user.
    
    Features:
    - Uses contextvars (async-safe)
    - Validates organization is active and subscription valid
    - Supports PostgreSQL RLS for database-level isolation
    - Allows superusers to switch organization context via header
    - Audit logs all superuser context switches
    
    MUST run AFTER AuthenticationMiddleware.
    """
    
    # Paths that don't require organization context
    PUBLIC_PATHS = [
        '/api/docs/',
        '/api/redoc/',
        '/api/schema/',
        '/api/health/',
        '/admin/',
        '/static/',
        '/media/',
    ]
    
    def process_request(self, request):
        try:
            from apps.core.models import Organization
            from apps.core.context import set_current_organization, set_current_user, clear_context
            from django.conf import settings
            from django.db import connection
            
            # TRACE LOG
            logger.info(f"TRACE: OrganizationMiddleware processing {request.path}")

            # Clear previous context (async-safe)
            clear_context()
            
            # Initialize organization to None (REQUIRED for subsequent middleware)
            request.organization = None
            
            # Check if path is public
            if any(request.path.startswith(path) for path in self.PUBLIC_PATHS):
                logger.info("TRACE: OrganizationMiddleware skipping public path")
                return None
            
            # Set user context
            if hasattr(request, 'user') and request.user.is_authenticated:
                logger.info(f"TRACE: OrganizationMiddleware user is authenticated: {request.user.email}")
                set_current_user(request.user)
                
                # Set organization from user
                if hasattr(request.user, 'organization') and request.user.organization:
                    org = request.user.organization
                    logger.info(f"TRACE: OrganizationMiddleware found user org: {org.name}")
                    
                    # Validate organization is active
                    if not org.is_active:
                        logger.warning(
                            f"User {request.user.email} attempted to access inactive organization {org.name}",
                            extra={
                                'user_id': str(request.user.id),
                                'organization_id': str(org.id),
                                'event': 'inactive_organization_access'
                            }
                        )
                        return JsonResponse({
                            'error': 'Organization is not active',
                            'code': 'ORGANIZATION_INACTIVE'
                        }, status=403)
                    
                    # Validate subscription status
                    if org.subscription_status in ['suspended', 'cancelled']:
                        logger.warning(
                            f"User {request.user.email} attempted to access organization with {org.subscription_status} subscription",
                            extra={
                                'user_id': str(request.user.id),
                                'organization_id': str(org.id),
                                'subscription_status': org.subscription_status,
                                'event': 'inactive_subscription_access'
                            }
                        )
                        return JsonResponse({
                            'error': f'Organization subscription is {org.subscription_status}',
                            'code': 'SUBSCRIPTION_INACTIVE',
                            'subscription_status': org.subscription_status
                        }, status=403)
                    
                    # Set organization context
                    set_current_organization(org)
                    request.organization = org
                    
                    # Set PostgreSQL RLS context variable for database-level isolation
                    if getattr(settings, 'ENABLE_POSTGRESQL_RLS', False):
                        try:
                            with connection.cursor() as cursor:
                                # LOCAL = only for this transaction
                                cursor.execute(
                                    "SET LOCAL app.current_organization_id = %s",
                                    [str(org.id)]
                                )
                        except Exception as e:
                            logger.error(
                                f"Failed to set PostgreSQL RLS context: {e}",
                                extra={
                                    'organization_id': str(org.id),
                                    'error': str(e)
                                }
                            )
                            # Don't fail the request, but log for monitoring
                
                else:
                    # User without organization
                    logger.info("TRACE: OrganizationMiddleware user has NO organization")
                    if request.user.is_superuser:
                        # Superuser can work without organization context
                        logger.info("TRACE: OrganizationMiddleware allowing superuser")
                        
                        # Allow X-Organization-ID or X-Tenant-Id header to switch context
                        org_id = request.headers.get('X-Organization-ID') or request.headers.get('X-Tenant-Id')
                        
                        if org_id:
                            logger.info(f"TRACE: OrganizationMiddleware superuser switching to {org_id}")
                            try:
                                org = Organization.objects.get(id=org_id, is_active=True)
                                
                                # AUDIT LOG: Track superuser context switching
                                log_superuser_org_switch(request.user, org, request)
                                
                                set_current_organization(org)
                                request.organization = org
                                
                                # Set PostgreSQL RLS for superuser too
                                if getattr(settings, 'ENABLE_POSTGRESQL_RLS', False):
                                    try:
                                        with connection.cursor() as cursor:
                                            cursor.execute(
                                                "SET LOCAL app.current_organization_id = %s",
                                                [str(org.id)]
                                            )
                                    except Exception as e:
                                        logger.error(f"Failed to set PostgreSQL RLS context for superuser: {e}")
                            
                            except Organization.DoesNotExist:
                                logger.warning(
                                    f"Superuser {request.user.email} attempted to switch to "
                                    f"non-existent organization {org_id}",
                                    extra={
                                        'user_id': str(request.user.id),
                                        'organization_id': org_id,
                                        'event': 'invalid_org_switch'
                                    }
                                )
                                return JsonResponse({
                                    'error': 'Invalid organization ID',
                                    'code': 'INVALID_ORGANIZATION'
                                }, status=400)
                            
                            except Exception as e:
                                logger.error(f"Error switching organization context: {e}")
                                return JsonResponse({
                                    'error': 'Internal server error',
                                    'code': 'INTERNAL_ERROR'
                                }, status=500)
                        
                        # Allow superuser to proceed without organization context
                        return None
                    
                    else:
                        # Regular user without organization - not allowed
                        logger.warning(
                            f"TRACE: Regular User {request.user.email} does not belong to any organization"
                        )
                        return JsonResponse({
                            'error': 'User does not belong to any organization',
                            'code': 'NO_ORGANIZATION'
                        }, status=403)
            else:
                 logger.info("TRACE: OrganizationMiddleware user NOT authenticated yet (or Anonymous)")
            
            return None

        except Exception as e:
            logger.error(f"OrganizationMiddleware CRASH: {e}", exc_info=True)
            # Return 500 in development for easier debugging
            if getattr(settings, 'DEBUG', False):
                import traceback
                return JsonResponse({
                    'error': str(e),
                    'traceback': traceback.format_exc(),
                    'source': 'OrganizationMiddleware'
                }, status=500)
            return JsonResponse({'error': 'Internal server error'}, status=500)
    
    def process_response(self, request, response):
        from apps.core.context import clear_context
        
        # Cleanup context after request (async-safe)
        clear_context()
        
        return response
    
    def process_exception(self, request, exception):
        from apps.core.context import clear_context
        
        # Cleanup context on exception too
        clear_context()
        
        return None
