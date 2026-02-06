#!/usr/bin/env python
import os
import sys
import django

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.db import connection

# Set to public schema
with connection.cursor() as cursor:
    cursor.execute("SET search_path = 'public';")
    
    # Check what billing migrations exist
    cursor.execute("""
        SELECT id, app, name, applied 
        FROM django_migrations 
        WHERE app = 'billing'
        ORDER BY id;
    """)
    
    migrations = cursor.fetchall()
    print(f"\nFound {len(migrations)} billing migrations in public schema:")
    for mid, app, name, applied in migrations:
        print(f"  - ID {mid}: {name} (applied: {applied})")
    
    if migrations:
        # Delete them
        cursor.execute("DELETE FROM django_migrations WHERE app = 'billing';")
        deleted = cursor.rowcount
        print(f"\nDeleted {deleted} billing migration records from public schema")
    else:
        print("\nNo billing migrations found in public schema")
