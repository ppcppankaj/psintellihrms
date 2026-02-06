import os
import sys
import django
from django.db import connection

# Add current directory to path
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

def clear_migrations():
    print("Clearing migration history...")
    with connection.cursor() as cursor:
        cursor.execute("TRUNCATE django_migrations CASCADE;")
    print("Migration history cleared!")

if __name__ == "__main__":
    clear_migrations()
