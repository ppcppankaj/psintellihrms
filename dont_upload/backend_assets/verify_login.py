import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.authentication.models import User
from django.contrib.auth.hashers import check_password

email = 'admin@intellihr.com'
password = 'Admin@123'

print("=" * 50)
print("LOGIN VERIFICATION")
print("=" * 50)

u = User.objects.filter(email=email).first()
if not u:
    print(f"❌ User '{email}' NOT FOUND")
    sys.exit(1)

print(f"✓ User found: {email}")
print(f"  - First Name: {u.first_name}")
print(f"  - Last Name: {u.last_name}")
print(f"  - Is Active: {u.is_active}")
print(f"  - Is Superuser: {u.is_superuser}")
print(f"  - Has Password: {bool(u.password)}")
print()

# Test password
if not u.password:
    print("❌ Password not set!")
    sys.exit(1)

is_correct = check_password(password, u.password)
print(f"Password Check: {'✓ CORRECT' if is_correct else '❌ INCORRECT'}")
print()

# Try authentication
from django.contrib.auth import authenticate
auth_user = authenticate(username=email, password=password)
if auth_user:
    print(f"✓ Django authentication successful")
else:
    print(f"❌ Django authentication failed")

print("=" * 50)
