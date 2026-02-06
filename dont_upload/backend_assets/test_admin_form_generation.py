#!/usr/bin/env python
"""
Test admin form generation to verify organization field handling
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.test import RequestFactory
from django.contrib.admin.sites import AdminSite
from apps.authentication.admin import UserAdmin
from apps.authentication.models import User
from apps.core.models import Organization

print("=" * 70)
print("TEST: Admin Form Generation for Organization Field")
print("=" * 70)

# Create test data
org = Organization.objects.first() or Organization.objects.create(name="Test Org", email="test@example.com")

superuser = User.objects.filter(email="super@test.com").first()
if not superuser:
    superuser = User.objects.create_superuser(
        email="super@test.com",
        password="Pass123!",
        organization=None
    )
    print(f"✅ Created superuser: {superuser.email}, is_superuser={superuser.is_superuser}")
else:
    print(f"✅ Found existing superuser: {superuser.email}, is_superuser={superuser.is_superuser}")

org_admin = User.objects.filter(username="admin").first()
if not org_admin:
    org_admin = User.objects.create_user(
        email="admin@test.com",
        username="admin",
        password="Pass123!",
        organization=org,
        is_org_admin=True,
        is_staff=True
    )
    print(f"✅ Created org admin: {org_admin.email}, is_org_admin={org_admin.is_org_admin}, is_superuser={org_admin.is_superuser}")
else:
    print(f"✅ Found existing org admin: {org_admin.email}, is_org_admin={org_admin.is_org_admin}, is_superuser={org_admin.is_superuser}")

# Create admin instance
admin_site = AdminSite()
user_admin = UserAdmin(User, admin_site)
factory = RequestFactory()

print("\n" + "=" * 70)
print("TEST 1: Superuser Admin Form")
print("=" * 70)

request = factory.get('/admin/authentication/user/')
request.user = superuser

print(f"Request user: {request.user.email}")
print(f"User is_superuser: {request.user.is_superuser}")

# Get form
form_class = user_admin.get_form(request)
print(f"\nForm fields for superuser: {list(form_class.base_fields.keys())}")

if 'organization' in form_class.base_fields:
    print("✅ organization field present in superuser form")
else:
    print("❌ organization field missing in superuser form")

# Get fieldsets
fieldsets = user_admin.get_fieldsets(request)
fieldset_names = [name for name, opts in fieldsets]
print(f"\nFieldset sections for superuser: {fieldset_names}")

if 'Organization' in fieldset_names:
    print("✅ Organization fieldset section present in superuser form")
else:
    print("❌ Organization fieldset section missing in superuser form")

print("\n" + "=" * 70)
print("TEST 2: Org Admin Form")
print("=" * 70)

request.user = org_admin

print(f"Request user: {request.user.email}")
print(f"User is_superuser: {request.user.is_superuser}")
print(f"User is_org_admin: {request.user.is_org_admin}")

# Get form
form_class = user_admin.get_form(request)
print(f"\nForm fields for org admin: {list(form_class.base_fields.keys())}")

if 'organization' not in form_class.base_fields:
    print("✅ organization field correctly removed from org admin form")
else:
    print("❌ organization field still present in org admin form (should be removed)")

# Get fieldsets
fieldsets = user_admin.get_fieldsets(request)
fieldset_names = [name for name, opts in fieldsets]
print(f"\nFieldset sections for org admin: {fieldset_names}")

if 'Organization' not in fieldset_names:
    print("✅ Organization fieldset section correctly hidden from org admin form")
else:
    print("❌ Organization fieldset section still visible for org admin (should be hidden)")

print("\n" + "=" * 70)
print("RESULT SUMMARY")
print("=" * 70)
print("If all checks above show ✅, the fix is working correctly")
print("Organization field should be:")
print("  - Visible to superusers (readonly)")
print("  - Hidden from org admins")
