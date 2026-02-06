import os
import sys
import django
from django.db import connection

# Add current directory to path
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

def drop_all_tables():
    print("Dropping all tables from the database...")
    with connection.cursor() as cursor:
        # Get all tables
        cursor.execute("""
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public'
        """)
        tables = cursor.fetchall()
        
        if not tables:
            print("No tables found.")
            return
            
        # Drop each table
        for table_name in tables:
            print(f"Dropping table: {table_name[0]}")
            cursor.execute(f'DROP TABLE IF EXISTS "{table_name[0]}" CASCADE;')
            
    print("All tables dropped successfully!")

if __name__ == "__main__":
    drop_all_tables()
