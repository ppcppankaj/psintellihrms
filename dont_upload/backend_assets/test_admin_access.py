#!/usr/bin/env python
"""
Test: Simulate actual Django admin page access
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.test import Client
from apps.authentication.models import User
from apps.core.models import Organization

print("=" * 70)
print("TESTING ACTUAL DJANGO ADMIN ACCESS")
print("=" * 70)

# Get superuser
superuser = User.objects.filter(email="super@test.com").first()
if not superuser:
    superuser = User.objects.create_superuser(
        email="super@test.com",
        password="Pass123!",
        username="super"
    )
    print(f"✅ Created superuser: {superuser.email}")
else:
    print(f"✅ Found existing superuser: {superuser.email}")

# Get a regular user to edit
regular_user = User.objects.filter(is_superuser=False, is_org_admin=False).first()
if not regular_user:
    org = Organization.objects.first() or Organization.objects.create(
        name="Test Org",
        email="test@example.com"
    )
    regular_user = User.objects.create_user(
        email="testuser@test.com",
        username="testuser",
        password="Pass123!",
        organization=org
    )
    print(f"✅ Created regular user: {regular_user.email}")
else:
    print(f"✅ Found existing regular user: {regular_user.email}")

# Test accessing the admin change page
client = Client()
print(f"\n1. Logging in as superuser: {superuser.email}")
login_result = client.login(email=superuser.email, password="Pass123!")

if not login_result:
    print("   ⚠️  Login failed with email/password")
    # Try with username
    login_result = client.login(username=superuser.username or superuser.email, password="Pass123!")

if login_result:
    print("   ✅ Login successful")
else:
    print("   ❌ Login failed")

print(f"\n2. Attempting to access admin change page for user {regular_user.id}")
try:
    response = client.get(f'/admin/authentication/user/{regular_user.id}/change/')
    
    print(f"   Response status: {response.status_code}")
    
    if response.status_code == 200:
        print("   ✅ SUCCESS: Admin change page loaded (FieldError fixed!)")
        # Check if form rendered without 'organization' field for regular user
        if 'organization' in response.content.decode():
            print("   ℹ️  Organization field is visible on the page")
        else:
            print("   ℹ️  Organization field is not visible on the page")
    elif response.status_code == 403:
        print("   ⚠️  Access denied (permission issue)")
    elif response.status_code == 404:
        print("   ⚠️  Admin page not found")
    else:
        print(f"   ⚠️  Unexpected status code")
        
except Exception as e:
    print(f"   ❌ Error accessing page: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 70)
print("RESULT: If you see 'SUCCESS' above, the fix is working!")
print("=" * 70)
