#!/usr/bin/env python
"""
Test: Verify organization field is editable for superusers when creating users
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
print("TEST: Organization Field Editable for Superuser")
print("=" * 70)

# Get superuser
superuser = User.objects.filter(is_superuser=True).first()
if not superuser:
    print("❌ No superuser found")
    exit(1)

print(f"✅ Found superuser: {superuser.email}")

# Create admin instance
admin_site = AdminSite()
user_admin = UserAdmin(User, admin_site)
factory = RequestFactory()

print("\n" + "=" * 70)
print("TEST 1: Adding New User (obj=None)")
print("=" * 70)

request = factory.get('/admin/authentication/user/add/')
request.user = superuser

# Get fieldsets for add
fieldsets_add = user_admin.get_fieldsets(request, obj=None)
add_fields = []
for name, opts in fieldsets_add:
    add_fields.extend(opts.get('fields', []))

print(f"Fields in add fieldsets: {add_fields}")

# Get actual form to see if organization is in base_fields
form_class = user_admin.get_form(request, obj=None)
form_fields = list(form_class.base_fields.keys())
print(f"Fields in form base_fields: {form_fields}")

if 'organization' in form_fields:
    print("✅ organization field present in form")
else:
    print("❌ organization field missing in form")

# Get readonly fields for add
readonly_add = user_admin.get_readonly_fields(request, obj=None)
print(f"\nReadonly fields when adding: {readonly_add}")

if 'organization' not in readonly_add:
    print("✅ organization field is NOT readonly when adding (editable)")
else:
    print("❌ organization field is readonly when adding (should be editable)")

print("\n" + "=" * 70)
print("TEST 2: Editing Existing User (obj=user)")
print("=" * 70)

# Get a regular user to edit
test_user = User.objects.filter(is_superuser=False).first()
if not test_user:
    from apps.core.models import Organization
    org = Organization.objects.first()
    if not org:
        org = Organization.objects.create(name="Test Org", email="test@example.com")
    test_user = User.objects.create_user(
        email="edittest@test.com",
        username="edittest",
        password="Pass123!",
        organization=org
    )
    print(f"✅ Created test user: {test_user.email}")
else:
    print(f"✅ Found test user: {test_user.email}")

request_edit = factory.get(f'/admin/authentication/user/{test_user.id}/change/')
request_edit.user = superuser

# Get fieldsets for edit
fieldsets_edit = user_admin.get_fieldsets(request_edit, obj=test_user)
fieldset_names = [name for name, opts in fieldsets_edit]

print(f"\nFieldset sections when editing: {fieldset_names}")

if 'Organization' in fieldset_names:
    print("✅ Organization fieldset present when editing")
else:
    print("❌ Organization fieldset missing when editing")

# Get readonly fields for edit
readonly_edit = user_admin.get_readonly_fields(request_edit, obj=test_user)
print(f"\nReadonly fields when editing: {readonly_edit}")

if 'organization' in readonly_edit:
    print("✅ organization field is readonly when editing existing user")
else:
    print("⚠️  organization field is NOT readonly when editing (should be readonly)")

print("\n" + "=" * 70)
print("TEST 3: Org Admin Cannot Select Organization")
print("=" * 70)

org_admin = User.objects.filter(is_org_admin=True, is_superuser=False).first()
if not org_admin:
    print("⚠️  No org admin found, skipping this test")
else:
    print(f"✅ Found org admin: {org_admin.email}")
    
    request_org = factory.get('/admin/authentication/user/add/')
    request_org.user = org_admin
    
    fieldsets_org_add = user_admin.get_fieldsets(request_org, obj=None)
    org_add_fields = []
    for name, opts in fieldsets_org_add:
        org_add_fields.extend(opts.get('fields', []))
    
    # Check form base_fields
    form_class_org = user_admin.get_form(request_org, obj=None)
    form_fields_org = list(form_class_org.base_fields.keys())
    
    print(f"\nFields for org admin add form (fieldsets): {org_add_fields}")
    print(f"Fields for org admin add form (base_fields): {form_fields_org}")
    
    if 'organization' not in form_fields_org:
        print("✅ organization field NOT present for org admin (correct)")
    else:
        print("❌ organization field present for org admin (should be hidden)")

print("\n" + "=" * 70)
print("SUMMARY")
print("=" * 70)
print("Superuser should be able to:")
print("  1. ✅ Select organization when ADDING new user (form has organization field)")
print("  2. ✅ See organization (readonly) when EDITING user")
print("Org admin should:")
print("  3. ✅ NOT see organization field at all")
print("\nIf all above show ✅, the fix is working correctly!")
print("=" * 70)
