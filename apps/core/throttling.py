"""
Rate Limiting - Per-organization throttling to prevent abuse
"""

from __future__ import annotations
from typing import Optional
from rest_framework.throttling import SimpleRateThrottle
from rest_framework.request import Request
from django.core.cache import cache
from rest_framework.throttling import SimpleRateThrottle


class OrganizationRateThrottle(SimpleRateThrottle):
    """
    Per-organization rate limiting.
    """
    
    scope = 'organization'
    rate = '10000/hour'
    
    def get_cache_key(self, request: Request, view: Optional[APIView]) -> Optional[str]:
        org = getattr(request, 'organization', None)
        if not org:
            return None
        
        return f"throttle:org:{org.id}"
    
    def get_rate(self):
        return self.rate


class OrganizationUserRateThrottle(SimpleRateThrottle):
    """
    Per-user rate limiting within an organization.
    """
    
    scope = 'org_user'
    rate = '1000/hour'
    
    def get_cache_key(self, request: Request, view: Optional[APIView]) -> Optional[str]:
        if not request.user.is_authenticated:
            return None
        
        org = getattr(request, 'organization', None)
        org_id = org.id if org else 'global'
        
        return f"throttle:org:{org_id}:user:{request.user.id}"


class LoginRateThrottle(SimpleRateThrottle):
    scope = 'login'

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)
        return f'login-throttle:{ident}'


class AttendancePunchThrottle(SimpleRateThrottle):
    """
    Attendance punch throttling.
    Prevents rapid punch attempts (potential fraud).
    """
    
    scope = 'attendance_punch'
    rate = '10/minute'  # Max 10 punch attempts per minute
    
    def get_cache_key(self, request: Request, view: Optional[APIView]) -> Optional[str]:
        if not request.user.is_authenticated:
            return None
        
        return f"throttle:punch:{request.user.id}"


class PasswordResetThrottle(SimpleRateThrottle):
    """
    Password reset throttling.
    Prevents email flooding.
    """
    
    scope = 'password_reset'
    rate = '3/hour'  # 3 reset requests per hour per IP
    
    def get_cache_key(self, request: Request, view: Optional[APIView]) -> Optional[str]:
        ip = self.get_ident(request)
        return f"throttle:password_reset:{ip}"


class APIKeyRateThrottle(SimpleRateThrottle):
    """
    API key rate limiting for external integrations.
    """
    
    scope = 'api_key'
    
    def get_cache_key(self, request: Request, view: Optional[APIView]) -> Optional[str]:
        api_key = request.META.get('HTTP_X_API_KEY')
        if not api_key:
            return None
        
        return f"throttle:api_key:{api_key}"
    
    def get_rate(self):
        """Get rate from API key settings"""
        # Could look up API key and get its specific rate limit
        return '1000/hour'


class BurstRateThrottle(SimpleRateThrottle):
    """
    Burst rate limiting to prevent rapid-fire requests.
    """
    
    scope = 'burst'
    rate = '60/minute'  # 60 requests per minute per user
    
    def get_cache_key(self, request: Request, view: Optional[APIView]) -> Optional[str]:
        if request.user.is_authenticated:
            return f"throttle:burst:user:{request.user.id}"
        
        ip = self.get_ident(request)
        return f"throttle:burst:ip:{ip}"


class SustainedRateThrottle(SimpleRateThrottle):
    """
    Sustained rate limiting for long-term abuse prevention.
    """
    
    scope = 'sustained'
    rate = '5000/day'  # 5k requests per day per user
    
    def get_cache_key(self, request: Request, view: Optional[APIView]) -> Optional[str]:
        if request.user.is_authenticated:
            return f"throttle:sustained:user:{request.user.id}"
        
        ip = self.get_ident(request)
        return f"throttle:sustained:ip:{ip}"


class LoginThrottle(SimpleRateThrottle):
    scope = 'login'
    THROTTLE_RATES = {'login': '5/hour'}


class ExportThrottle(SimpleRateThrottle):
    scope = 'export'
    THROTTLE_RATES = {'export': '10/hour'}


# =============================================================================
# THROTTLE UTILITY FUNCTIONS
# =============================================================================

def is_tenant_rate_limited(organization_id: str) -> bool:
    """Check if a tenant is currently rate limited"""
    key = f"throttle:tenant:{organization_id}"
    return cache.get(key, 0) > 10000  # Threshold


def get_tenant_request_count(organization_id: str) -> int:
    """Get current request count for a tenant"""
    key = f"throttle:tenant:{organization_id}"
    return cache.get(key, 0)


def get_user_request_count(user_id: int) -> int:
    """Get current request count for a user"""
    key = f"throttle:burst:user:{user_id}"
    return cache.get(key, 0)


def block_ip(ip_address: str, duration_seconds: int = 3600) -> None:
    """Temporarily block an IP address"""
    key = f"blocked:ip:{ip_address}"
    cache.set(key, True, duration_seconds)


def is_ip_blocked(ip_address: str) -> bool:
    """Check if IP is blocked"""
    key = f"blocked:ip:{ip_address}"
    return cache.get(key, False)


def unblock_ip(ip_address: str) -> None:
    """Unblock an IP address"""
    key = f"blocked:ip:{ip_address}"
    cache.delete(key)


# =============================================================================
# THROTTLE SETTINGS FOR DIFFERENT ENDPOINTS
# =============================================================================

THROTTLE_CLASSES_BY_ENDPOINT: dict[str, list[type[SimpleRateThrottle]]] = {
    'login': [LoginRateThrottle, BurstRateThrottle],
    'password_reset': [PasswordResetThrottle],
    'attendance_punch': [AttendancePunchThrottle, OrganizationUserRateThrottle],
    'api': [OrganizationRateThrottle, OrganizationUserRateThrottle, BurstRateThrottle],
    'report_export': [OrganizationUserRateThrottle],  # Heavy operations
}
