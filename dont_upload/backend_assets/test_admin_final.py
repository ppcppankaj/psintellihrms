#!/usr/bin/env python
"""
Final test: Check if admin form correctly handles organization field
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.admin.sites import AdminSite
from django.test import RequestFactory
from apps.authentication.admin import UserAdmin
from apps.authentication.models import User

print("=" * 70)
print("FINAL VERIFICATION: Organization Field in Admin Forms")
print("=" * 70)

# Get existing users  
super_user = User.objects.filter(email="super@test.com").first()
org_admin_users = User.objects.filter(is_org_admin=True, is_superuser=False)

if super_user:
    print(f"\n✅ Found superuser: {super_user.email}")
else:
    print("\n❌ Superuser not found")
    exit(1)

if org_admin_users.exists():
    org_admin = org_admin_users.first()
    print(f"✅ Found org admin: {org_admin.email} (org: {org_admin.organization})")
else:
    print("⚠️  No org admin found, creating one...")
    from apps.core.models import Organization
    org = Organization.objects.first()
    if not org:
        org = Organization.objects.create(name="Test Org", email="test@org.com")
    org_admin = User.objects.create_user(
        email="orgadmin@test.com",
        username="orgadmin",
        password="Pass123!",
        organization=org,
        is_org_admin=True,
        is_staff=True
    )
    print(f"✅ Created org admin: {org_admin.email}")

admin_site = AdminSite()
user_admin = UserAdmin(User, admin_site)
factory = RequestFactory()

print("\n" + "=" * 70)
print("TEST 1: Superuser Admin Form")
print("=" * 70)

request = factory.get('/admin/authentication/user/')
request.user = super_user

try:
    form_super = user_admin.get_form(request)
    super_fields = list(form_super.base_fields.keys())
    
    print(f"User: {super_user.email}")
    print(f"Is superuser: {super_user.is_superuser}")
    print(f"Form has 'organization' field: {'organization' in super_fields}")
    
    if 'organization' in super_fields:
        print("✅ Superuser can see organization field")
    else:
        print("⚠️  organization field missing from superuser form (may be handled as readonly)")
        
except Exception as e:
    print(f"❌ Error creating superuser form: {e}")

print("\n" + "=" * 70)
print("TEST 2: Org Admin Form")
print("=" * 70)

request.user = org_admin

try:
    form_org = user_admin.get_form(request)
    org_fields = list(form_org.base_fields.keys())
    
    print(f"User: {org_admin.email}")
    print(f"Is superuser: {org_admin.is_superuser}")
    print(f"Is org_admin: {org_admin.is_org_admin}")
    print(f"Form has 'organization' field: {'organization' in org_fields}")
    
    if 'organization' not in org_fields:
        print("✅ Organization field correctly removed for org admin")
    else:
        print("❌ organization field still present (should be hidden)")
        
except Exception as e:
    print(f"❌ Error creating org admin form: {e}")

print("\n" + "=" * 70)
print("CRITICAL TEST: Can we access admin without FieldError?")
print("=" * 70)

try:
    # Try to get the form as if rendering the edit page
    test_user = org_admin
    request = factory.get(f'/admin/authentication/user/{test_user.id}/change/')
    request.user = super_user
    
    form_class = user_admin.get_form(request, test_user)
    print(f"✅ Successfully created form for editing user {test_user.email}")
    print(f"   (No FieldError thrown - admin page should load)")
    
except Exception as e:
    print(f"❌ Error when trying to edit user: {e}")
    print(f"   (This would cause admin page to fail)")
