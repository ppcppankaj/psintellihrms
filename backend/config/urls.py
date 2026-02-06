"""
URL Configuration for HRMS
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse, HttpResponse, HttpRequest
from django.views.generic import RedirectView
from apps.core.compat_views import DocumentCompatView
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

# Simple health check view
def health_check(request: HttpRequest) -> JsonResponse:
    """Simple health check endpoint"""
    return JsonResponse({'status': 'ok', 'service': 'hrms-backend'})

# Favicon view - returns a minimal valid favicon
def favicon(request: HttpRequest) -> HttpResponse:
    """Return a minimal valid favicon (1x1 transparent PNG)"""
    # Minimal 1x1 transparent PNG as base64
    png_base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    import base64
    png_data = base64.b64decode(png_base64)
    return HttpResponse(png_data, content_type='image/png')

urlpatterns = [
    # Redirect root to admin for convenience
    path('', RedirectView.as_view(url='/admin/', permanent=False)),

    # Health check
    path('api/health/', health_check, name='health-check'),
    path('favicon.ico', favicon, name='favicon'),
    
    # Admin
    path('admin/', admin.site.urls),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # API v1 endpoints
    path('api/v1/auth/', include('apps.authentication.urls')),
    path('api/v1/employees/', include('apps.employees.urls')),
    path('api/v1/recruitment/', include('apps.recruitment.urls')),
    path('api/v1/attendance/', include('apps.attendance.urls')),
    path('api/v1/leave/', include('apps.leave.urls')),
    path('api/v1/payroll/', include('apps.payroll.urls')),
    path('api/v1/performance/', include('apps.performance.urls')),
    path('api/v1/workflows/', include('apps.workflows.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
    path('api/v1/ai/', include('apps.ai_services.urls')),
    path('api/v1/reports/', include('apps.reports.urls')),
    path('api/v1/compliance/', include('apps.compliance.urls')),
    path('api/v1/integrations/', include('apps.integrations.urls')),
    path('api/v1/billing/', include('apps.billing.urls')),
    path('api/v1/abac/', include('apps.abac.urls')),
    path('api/v1/core/', include('apps.core.urls')),
    path('api/v1/onboarding/', include('apps.onboarding.urls')),
    path('api/v1/expenses/', include('apps.expenses.urls')),
    path('api/v1/assets/', include('apps.assets.urls')),
    path('api/v1/chat/', include('apps.chat.urls')),
    path('api/v1/training/', include('apps.training.urls')),

    # Compatibility placeholders (non-breaking stubs)
    path('api/v1/documents/', DocumentCompatView.as_view()),
    path('api/v1/documents/<path:subpath>/', DocumentCompatView.as_view()),
    # Training endpoints are now fully implemented in apps.training
]

# Debug toolbar
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    
    # try:
    #     import debug_toolbar
    #     urlpatterns = [
    #         path('__debug__/', include(debug_toolbar.urls)),
    #     ] + urlpatterns
    # except ImportError:
    #     pass

handler404 = 'apps.core.views.api_404_view'
