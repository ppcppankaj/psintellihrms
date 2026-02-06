#!/usr/bin/env python
"""Check if billing tables exist in public schema."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.db import connection

cursor = connection.cursor()
cursor.execute("SET search_path = 'public'")
cursor.execute("""
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname='public' AND tablename LIKE 'billing_%'
    ORDER BY tablename
""")

tables = cursor.fetchall()
print(f"Found {len(tables)} billing tables in public schema:")
for table in tables:
    print(f"  - {table[0]}")
