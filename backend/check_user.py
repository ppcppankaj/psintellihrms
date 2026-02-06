from apps.authentication.models import User
import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

email = 'admin@psintellihr.com'
password = 'ppcp1234'
u = User.objects.filter(email=email).first()
print(f'User exists: {u is not None}')
if u:
    print(f'Is superuser: {u.is_superuser}')
    print(f'Is verified: {u.is_verified}')
    print(f'Is active: {u.is_active}')
    print(f'Check password: {u.check_password(password)}')
    if not u.check_password(password):
         print(f'Trying alternate password admin123: {u.check_password("admin123")}')
else:
    print('User not found')
