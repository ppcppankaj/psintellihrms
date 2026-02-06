"""
Diagnostic Script - Run this to check system health
Usage: docker-compose -f docker-compose.dev.yml run --rm backend python backend/diagnose.py
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.db import connection
from django.conf import settings


def check_database():
    """Check database connectivity"""
    print("=== Database Check ===")
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT version();")
            version = cursor.fetchone()[0]
            print(f"✅ PostgreSQL connected: {version}")
            return True
    except Exception as e:
        print(f"❌ Database error: {e}")
        return False


def check_schema():
    """Check if public schema exists"""
    print("\n=== Schema Check ===")
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'public';")
            result = cursor.fetchone()
            if result:
                print(f"✅ Public schema exists")
                return True
            else:
                print(f"❌ Public schema not found")
                return False
    except Exception as e:
        print(f"❌ Schema check error: {e}")
        return False


def check_migrations():
    """Check if migrations are applied"""
    print("\n=== Migrations Check ===")
    try:
        from django.db.migrations.recorder import MigrationRecorder
        recorder = MigrationRecorder(connection)
        
        if not recorder.has_table():
            print("❌ django_migrations table does not exist - run: python manage.py migrate")
            return False
        
        migrations = recorder.migration_qs.all()
        count = migrations.count()
        
        if count == 0:
            print("❌ No migrations applied - run: python manage.py migrate")
            return False
        
        print(f"✅ {count} migrations applied")
        
        # Check specific apps
        apps_to_check = ['tenants', 'authentication', 'employees', 'attendance']
        for app in apps_to_check:
            app_migrations = migrations.filter(app=app).count()
            if app_migrations > 0:
                print(f"  ✓ {app}: {app_migrations} migration(s)")
            else:
                print(f"  ⚠ {app}: No migrations found")
        
        return True
    except Exception as e:
        print(f"❌ Migration check error: {e}")
        return False


def check_public_tenant():
    """Check if public tenant exists"""
    print("\n=== Public Tenant Check ===")
    try:
        from apps.tenants.models import Tenant, Domain
        
        public_tenant = Tenant.objects.filter(schema_name='public').first()
        if not public_tenant:
            print("❌ Public tenant not found - run seed_data.py")
            return False
        
        print(f"✅ Public tenant exists: {public_tenant.name}")
        
        # Check domain
        localhost_domain = Domain.objects.filter(domain='localhost', tenant=public_tenant).first()
        if localhost_domain:
            print(f"✅ Localhost domain exists")
        else:
            print(f"⚠ Localhost domain not found - health checks may fail")
        
        return True
    except Exception as e:
        print(f"❌ Tenant check error: {e}")
        return False


def check_superuser():
    """Check if superuser exists"""
    print("\n=== Superuser Check ===")
    try:
        from apps.authentication.models import User
        
        superusers = User.objects.filter(is_superuser=True, is_active=True)
        count = superusers.count()
        
        if count == 0:
            print("❌ No superuser found - run seed_data.py or: python manage.py createsuperuser")
            return False
        
        print(f"✅ {count} superuser(s) found:")
        for user in superusers:
            print(f"  • {user.email}")
        
        return True
    except Exception as e:
        print(f"❌ Superuser check error: {e}")
        return False


def check_redis():
    """Check Redis connectivity"""
    print("\n=== Redis Check ===")
    try:
        from django.core.cache import cache
        
        # Test set/get
        cache.set('diagnostic_test', 'hello', 10)
        value = cache.get('diagnostic_test')
        
        if value == 'hello':
            print("✅ Redis connected and working")
            cache.delete('diagnostic_test')
            return True
        else:
            print("❌ Redis set/get failed")
            return False
    except Exception as e:
        print(f"❌ Redis error: {e}")
        return False


def check_settings():
    """Check critical settings"""
    print("\n=== Settings Check ===")
    try:
        print(f"DEBUG: {settings.DEBUG}")
        print(f"SECRET_KEY: {'✅ Set' if settings.SECRET_KEY else '❌ Missing'}")
        print(f"ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")
        print(f"BASE_DOMAIN: {getattr(settings, 'BASE_DOMAIN', 'Not set')}")
        print(f"TENANT_MODEL: {settings.TENANT_MODEL}")
        print(f"DATABASE: {settings.DATABASES['default']['NAME']}@{settings.DATABASES['default']['HOST']}")
        return True
    except Exception as e:
        print(f"❌ Settings check error: {e}")
        return False


def main():
    print("\n" + "="*60)
    print("PS IntelliHR - System Diagnostics")
    print("="*60 + "\n")
    
    checks = [
        ("Database", check_database),
        ("Schema", check_schema),
        ("Migrations", check_migrations),
        ("Public Tenant", check_public_tenant),
        ("Superuser", check_superuser),
        ("Redis", check_redis),
        ("Settings", check_settings),
    ]
    
    results = []
    for name, check_func in checks:
        try:
            result = check_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n❌ {name} check failed with exception: {e}")
            results.append((name, False))
    
    # Summary
    print("\n" + "="*60)
    print("Summary")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {name}")
    
    print(f"\nScore: {passed}/{total}")
    
    if passed == total:
        print("\n✅ All checks passed! System is healthy.")
        print("\nYou can now:")
        print("  1. Start services: docker-compose -f docker-compose.dev.yml up")
        print("  2. Access admin: http://localhost:8000/admin/")
        print("  3. Test API: http://localhost:8000/api/health/")
    else:
        print("\n⚠ Some checks failed. Fix the issues above and re-run.")
        print("\nCommon fixes:")
        print("  • Migrations: docker-compose run backend python manage.py migrate")
        print("  • Seed data: docker-compose run backend python manage.py shell < backend/seed_data.py")
        print("  • Superuser: docker-compose run backend python manage.py createsuperuser")
    
    print("\n" + "="*60 + "\n")
    
    # Exit code for CI/CD
    sys.exit(0 if passed == total else 1)


if __name__ == '__main__':
    main()
