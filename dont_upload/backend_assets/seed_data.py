"""
Seed script to create default organization and admin user
Run: python backend/manage.py shell < backend/seed_data.py
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.core.models import Organization
from apps.authentication.models import User
from django.db import connection

def seed_organization():
    """Create or get default organization"""
    print("=== Seeding Default Organization ===")
    
    # Check if any organization exists
    org = Organization.objects.first()
    
    if not org:
        print("Creating default organization...")
        org = Organization.objects.create(
            name='PS IntelliHR',
            email='admin@psintellhr.com',
            timezone='Asia/Kolkata',
            currency='INR',
            subscription_status='active',
            is_active=True,
        )
        print(f"✓ Organization created: {org.name}")
    else:
        print(f"✓ Organization already exists: {org.name}")
    
    return org


def seed_superuser():
    """Create superuser admin"""
    print("\n=== Seeding Superuser ===")
    
    email = 'admin@psintellhr.com'
    
    # Check if user exists
    user = User.objects.filter(email=email).first()
    
    if not user:
        print("Creating superuser...")
        user = User.objects.create_superuser(
            email=email,
            password='admin123',
            first_name='System',
            last_name='Admin',
            is_superuser=True,
            is_staff=True,
            is_active=True,
        )
        print(f"✓ Superuser created: {user.email}")
        print(f"  Email: {email}")
        print(f"  Password: admin123")
    else:
        print(f"✓ Superuser already exists: {user.email}")
        # Ensure user is staff/superuser
        if not user.is_superuser:
            user.is_superuser = True
            user.is_staff = True
            user.save()
            print("✓ Updated user to superuser")
    
    return user


def main():
    print("\n" + "="*60)
    print("PS IntelliHR - Database Seeding (Organization-Based)")
    print("="*60 + "\n")
    
    try:
        # Seed data
        org = seed_organization()
        superuser = seed_superuser()
        
        # Link superuser to organization if not linked
        if not superuser.organization:
            superuser.organization = org
            superuser.save()
            print(f"✓ Linked superuser to organization: {org.name}")

        print("\n" + "="*60)
        print("✓ Seeding Complete!")
        print("="*60)
        print("\nAccess Points:")
        print("  - Admin: http://localhost:8000/admin/")
        print("  - API Docs: http://localhost:8000/api/docs/")
        print("\nCredentials:")
        print("  Email: admin@psintellhr.com")
        print("  Password: admin123")
        print("\n" + "="*60 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
