"""
Django Settings - Base Configuration
Enterprise HRMS SaaS Platform
"""

import os
from pathlib import Path
from datetime import timedelta
from decouple import config, Csv
from pythonjsonlogger import jsonlogger

# ============================================================================
# PATHS
# ============================================================================

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# ============================================================================
# SECURITY
# ============================================================================

DEBUG = config('DEBUG', default=False, cast=bool)
SECRET_KEY = config('SECRET_KEY', default='django-insecure-development-key-change-in-production')
FIELD_ENCRYPTION_KEY = config(
    'FIELD_ENCRYPTION_KEY',
    default='JKLjPxZvMnBqWrStUvWxYzAbCdEfGhIjKlMnOpQrStUv='
)

if SECRET_KEY == 'django-insecure-development-key-change-in-production' and not DEBUG:
    from django.core.exceptions import ImproperlyConfigured
    raise ImproperlyConfigured(
        "The SECRET_KEY setting must not be the default in production."
    )

if not DEBUG:
    required_secrets = ['SECRET_KEY', 'POSTGRES_PASSWORD']
    missing = [s for s in required_secrets if not os.getenv(s)]
    if missing:
        from django.core.exceptions import ImproperlyConfigured
        raise ImproperlyConfigured(f"Missing secrets: {missing}")

# ============================================================================
# MULTI-TENANCY
# ============================================================================

ENVIRONMENT = config('ENVIRONMENT', default='development')
REQUIRE_ORGANIZATION_CONTEXT = config(
    'REQUIRE_ORGANIZATION_CONTEXT', default=True, cast=bool
)
ENABLE_POSTGRESQL_RLS = config(
    'ENABLE_POSTGRESQL_RLS', default=False, cast=bool
)

# ============================================================================
# HOSTS
# ============================================================================

if DEBUG:
    ALLOWED_HOSTS = ['*']
else:
    ALLOWED_HOSTS = config(
        'ALLOWED_HOSTS', default='localhost,127.0.0.1', cast=Csv()
    )

# ============================================================================
# APPLICATIONS
# ============================================================================

INSTALLED_APPS = [
    'daphne',

    # Django core (MUST be first)
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # ✅ Custom User App (IMMEDIATELY after auth)
    'apps.authentication',

    # Domain apps (depend on User)
    'apps.core',
    'apps.billing',
    'apps.abac',
    'apps.employees',
    'apps.recruitment',
    'apps.attendance',
    'apps.leave',
    'apps.payroll',
    'apps.performance',
    'apps.workflows',
    'apps.notifications',
    'apps.ai_services',
    'apps.reports',
    'apps.compliance',
    'apps.integrations',
    'apps.training',
    'apps.onboarding',
    'apps.expenses',
    'apps.assets',
    'apps.chat',

    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    'django_celery_results',
    'django_celery_beat',
    'channels',
]


# ============================================================================
# MIDDLEWARE
# ============================================================================

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'apps.core.middleware.CorrelationIdMiddleware',
    'apps.core.middleware.RequestIDMiddleware',
    'apps.core.middleware.MetricsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',

    'apps.core.middleware_organization.OrganizationMiddleware',
    # 'apps.core.middleware.BranchContextMiddleware',
    # 'apps.core.middleware.OrganizationAuthMiddleware',
    # 'apps.core.middleware.CorrelationIdMiddleware',


    'django.contrib.messages.middleware.MessageMiddleware',
    'apps.core.middleware.SecurityHeadersMiddleware',
]

# ============================================================================
# URL / ASGI / WSGI
# ============================================================================

BASE_DOMAIN = config('BASE_DOMAIN', default='localhost')

ROOT_URLCONF = 'config.urls'
WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

# ============================================================================
# TEMPLATES
# ============================================================================

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# ============================================================================
# DATABASE (✅ DOCKER-SAFE)
# ============================================================================

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('POSTGRES_DB', default='ps_intellihr'),
        'USER': config('POSTGRES_USER', default='hrms_admin'),
        'PASSWORD': config('POSTGRES_PASSWORD', default='password'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
        'CONN_MAX_AGE': 60,
    }
}

# ============================================================================
# CHANNELS / REDIS (✅ DOCKER-SAFE)
# ============================================================================

REDIS_BASE_URL = config('REDIS_URL', default='redis://redis:6379')

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [f"{REDIS_BASE_URL}/3"],
        },
    },
}

# ============================================================================
# AUTH
# ============================================================================

AUTH_USER_MODEL = 'authentication.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ============================================================================
# I18N
# ============================================================================

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

# ============================================================================
# STATIC / MEDIA
# ============================================================================

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ============================================================================
# DRF
# ============================================================================

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'apps.authentication.authentication.OrganizationAwareJWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.IsAuthenticated'],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'apps.core.pagination.StandardResultsPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'EXCEPTION_HANDLER': 'apps.core.exceptions.custom_exception_handler',
}

# ============================================================================
# JWT
# ============================================================================

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
}

# ============================================================================
# CORS / CSRF
# ============================================================================

CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:3000,http://localhost:5173',
    cast=Csv()
)
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8000',
    'http://localhost:8001',
    'http://127.0.0.1:8001',
]

# ============================================================================
# CELERY (✅ DOCKER-SAFE)
# ============================================================================

CELERY_BROKER_URL = config(
    'CELERY_BROKER_URL', default='redis://redis:6379/0'
)
CELERY_RESULT_BACKEND = config(
    'CELERY_RESULT_BACKEND', default='redis://redis:6379/1'
)
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

# ============================================================================
# CACHE
# ============================================================================

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': f'{REDIS_BASE_URL}/2',
    }
}

SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'

# ============================================================================
# LOGGING
# ============================================================================

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'filters': {
        'correlation_id': {
            '()': 'apps.core.logging.CorrelationIdFilter',
        },
    },
    'formatters': {
        'standard': {
            'format': '%(asctime)s %(levelname)s [%(correlation_id)s] %(name)s: %(message)s',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'filters': ['correlation_id'],
            'formatter': 'standard',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}

# ============================================================================
# EMAIL
# ============================================================================

EMAIL_BACKEND = config(
    'EMAIL_BACKEND',
    default='django.core.mail.backends.console.EmailBackend'
)

# ============================================================================
# AI
# ============================================================================

OPENAI_API_KEY = config('OPENAI_API_KEY', default='')
AI_MODEL_PATH = BASE_DIR / 'ai_models'

DEFAULT_FROM_EMAIL = "HRMS <noreply@pankaj.im>"
EMAIL_USE_SSL = True
EMAIL_PORT = 465