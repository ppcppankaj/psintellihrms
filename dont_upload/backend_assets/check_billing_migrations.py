#!/usr/bin/env python
"""Check which billing migrations are applied."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.db import connection

cursor = connection.cursor()
cursor.execute("SET search_path = 'public'")
cursor.execute("""
    SELECT app, name, applied
    FROM django_migrations
    WHERE app = 'billing'
    ORDER BY applied
""")

migrations = cursor.fetchall()
print(f"Found {len(migrations)} billing migrations recorded:")
for app, name, applied in migrations:
    print(f"  - {name} (applied: {applied})")
