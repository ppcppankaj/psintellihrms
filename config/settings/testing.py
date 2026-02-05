"""
Django Settings - Testing Configuration
"""

from .base import *

DEBUG = False
TESTING = True

# Use faster password hasher
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Database - Standard PostgreSQL for organization-based isolation
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', default='ps_intellihr'),
        'USER': config('DB_USER', default='hrms_admin'),
        'PASSWORD': config('DB_PASSWORD', default='password'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
        'TEST': {
            'NAME': 'test_ps_intellihr_temp',
            'CHARSET': 'UTF8',
        }
    }
}

# The test runner will handle creating the public schema and migrations
# We just need to make sure the database engine is correct.
MIGRATION_MODULES = {}

# Disable throttling
REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'] = []

# Use sync Celery
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Disable logging during tests
LOGGING = {}

# Email - In-memory backend
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'
