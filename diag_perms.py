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
    user = User.objects.get(email='admin@psintellihr.com')
    serializer = UserSerializer(user)
    roles = serializer.data.get('roles', [])
    permissions = serializer.data.get('permissions', [])
    
    print(f"User: {user.email}")
    print(f"Is Superuser: {user.is_superuser}")
    print(f"Roles: {roles}")
    print(f"Permissions Count: {len(permissions)}")
    if permissions:
        print(f"Sample Permissions: {permissions[:5]}")
except Exception as e:
    print(f"Error: {e}")
