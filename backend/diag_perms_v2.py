import django
import os
import sys

# Add the project root to sys.path
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.authentication.models import User
from apps.authentication.serializers import UserSerializer

try:
    # Test for standard admin
    user = User.objects.get(email='admin@psintellihr.com')
    print(f"--- Testing admin@psintellihr.com ---")
    serializer = UserSerializer(user)
    roles = serializer.data.get('roles', [])
    permissions = serializer.data.get('permissions', [])
    print(f"Roles: {roles}")
    print(f"Permissions Count: {len(permissions)}")

    # Test for the user reporting the error if possible (or just simulate a non-su user if we can find one)
    # If pankaj@pankaj.im exists, test it
    try:
        user2 = User.objects.get(email='pankaj@pankaj.im')
        print(f"\n--- Testing pankaj@pankaj.im ---")
        serializer2 = UserSerializer(user2)
        roles2 = serializer2.data.get('roles', [])
        permissions2 = serializer2.data.get('permissions', [])
        print(f"Roles: {roles2}")
        print(f"Permissions Count: {len(permissions2)}")
    except User.DoesNotExist:
        print("\nUser pankaj@pankaj.im not found in DB.")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
