"""
Django Settings - Production Configuration
"""

from .base import *
from decouple import config, Csv
from django.core.exceptions import ImproperlyConfigured

DEBUG = False

if not REDIS_CACHE_URL:
    raise ImproperlyConfigured(
        "REDIS_CACHE_URL is required in production for distributed throttling and abuse protection."
    )

# ============================================================================
# SECURITY HARDENING
# ============================================================================

SECURE_SSL_REDIRECT = config("SECURE_SSL_REDIRECT", default=True, cast=bool)

CSRF_USE_SESSIONS = False

SECURE_HSTS_SECONDS = config("SECURE_HSTS_SECONDS", default=31536000, cast=int)
SECURE_HSTS_INCLUDE_SUBDOMAINS = config("SECURE_HSTS_INCLUDE_SUBDOMAINS", default=True, cast=bool)
SECURE_HSTS_PRELOAD = config("SECURE_HSTS_PRELOAD", default=True, cast=bool)

SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"

CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = "Lax"
CSRF_TRUSTED_ORIGINS = config(
    "CSRF_TRUSTED_ORIGINS",
    default="https://hrms.pankaj.im,https://www.hrms.pankaj.im",
    cast=Csv(),
)

CSRF_COOKIE_DOMAIN = config("CSRF_COOKIE_DOMAIN", default=".pankaj.im")
SESSION_COOKIE_DOMAIN = config("SESSION_COOKIE_DOMAIN", default=".pankaj.im")

X_FRAME_OPTIONS = "DENY"
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"
ENABLE_API_DOCS = config("ENABLE_API_DOCS", default=False, cast=bool)

# ============================================================================
# REST FRAMEWORK - THROTTLING
# ============================================================================

REST_FRAMEWORK["DEFAULT_THROTTLE_CLASSES"] = [
    "apps.core.throttling.BurstRateThrottle",
    "apps.core.throttling.SustainedRateThrottle",
    "apps.core.throttling.OrganizationRateThrottle",
    "apps.core.throttling.OrganizationUserRateThrottle",
    "rest_framework.throttling.AnonRateThrottle",
    "rest_framework.throttling.UserRateThrottle",
    "rest_framework.throttling.ScopedRateThrottle",
]

REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = {
    "anon": config("THROTTLE_ANON_RATE", default="120/hour"),
    "user": config("THROTTLE_USER_RATE", default="3000/hour"),
    "burst": config("THROTTLE_BURST_RATE", default="180/minute"),
    "sustained": config("THROTTLE_SUSTAINED_RATE", default="50000/day"),
    "organization": config("THROTTLE_ORGANIZATION_RATE", default="200000/hour"),
    "org_user": config("THROTTLE_ORG_USER_RATE", default="30000/hour"),
    "login": config("THROTTLE_LOGIN_RATE", default="10/minute"),
    "password_reset": config("THROTTLE_PASSWORD_RESET_RATE", default="8/hour"),
    "two_factor": config("THROTTLE_TWO_FACTOR_RATE", default="30/hour"),
    "attendance_punch": config("THROTTLE_ATTENDANCE_PUNCH_RATE", default="60/minute"),
    "report_export": config("THROTTLE_REPORT_EXPORT_RATE", default="30/hour"),
    "api_key": config("THROTTLE_API_KEY_RATE", default="10000/hour"),
}

# ============================================================================
# LOGGING (JSON, PROD)
# ============================================================================

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "filters": {
        "correlation_id": {
            "()": "apps.core.logging.CorrelationIdFilter",
        }
    },
    "formatters": {
        "json": {
            "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
            "fmt": "%(asctime)s %(levelname)s %(name)s %(message)s %(correlation_id)s",
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "json",
            "filters": ["correlation_id"],
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django.security": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
        "apps.core.exceptions": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
        "security.audit": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
    },
}

# ============================================================================
# SENTRY
# ============================================================================

import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.celery import CeleryIntegration
from sentry_sdk.integrations.redis import RedisIntegration

SENTRY_DSN = config("SENTRY_DSN", default="")

if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[
            DjangoIntegration(),
            CeleryIntegration(),
            RedisIntegration(),
        ],
        traces_sample_rate=0.1,
        send_default_pii=False,
    )
