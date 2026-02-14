from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.views.generic import RedirectView
from drf_spectacular.views import SpectacularRedocView, SpectacularSwaggerView

from apps.core.compat_views import DocumentCompatView


urlpatterns = [
    path("", RedirectView.as_view(url="/admin/", permanent=False)),
    path("admin/", admin.site.urls),
    path("api/v1/auth/", include("apps.authentication.urls")),
    path("api/v1/employees/", include("apps.employees.urls")),
    path("api/v1/recruitment/", include("apps.recruitment.urls")),
    path("api/v1/attendance/", include("apps.attendance.urls")),
    path("api/v1/leave/", include("apps.leave.urls")),
    path("api/v1/payroll/", include("apps.payroll.urls")),
    path("api/v1/performance/", include("apps.performance.urls")),
    path("api/v1/workflows/", include("apps.workflows.urls")),
    path("api/v1/notifications/", include("apps.notifications.urls")),
    path("api/v1/ai/", include("apps.ai_services.urls")),
    path("api/v1/reports/", include("apps.reports.urls")),
    path("api/v1/compliance/", include("apps.compliance.urls")),
    path("api/v1/integrations/", include("apps.integrations.urls")),
    path("api/v1/billing/", include("apps.billing.urls")),
    path("api/v1/abac/", include("apps.abac.urls")),
    path("api/v1/core/", include("apps.core.urls")),
    path("api/v1/onboarding/", include("apps.onboarding.urls")),
    path("api/v1/expenses/", include("apps.expenses.urls")),
    path("api/v1/assets/", include("apps.assets.urls")),
    path("api/v1/chat/", include("apps.chat.urls")),
    path("api/v1/training/", include("apps.training.urls")),
    path("api/v1/documents/", DocumentCompatView.as_view()),
    path("api/v1/documents/<path:subpath>/", DocumentCompatView.as_view()),
]

if getattr(settings, "ENABLE_API_DOCS", False):
    urlpatterns += [
        path(
            "api/docs/",
            SpectacularSwaggerView.as_view(url="/static/schema.json"),
            name="swagger-ui",
        ),
        path(
            "api/redoc/",
            SpectacularRedocView.as_view(url="/static/schema.json"),
            name="redoc",
        ),
    ]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

