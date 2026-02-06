
import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from rest_framework.test import APIClient

def diagnose():
    client = APIClient()
    url = '/api/v1/tenants/signup_config/'
    print(f"Testing GET {url} with APIClient...")
    
    try:
        response = client.get(url)
        print(f"Status: {response.status_code}")
        if response.status_code == 500:
            # In debug mode, response content might have traceback, 
            # but usually it's better to force the error to bubble up if possible 
            # or look at how DRF handles it. 
            # If exception handler catches it, it returns 500 Response.
             print("Response Content (First 1000 chars):")
             print(str(response.content)[:1000])
             
    except Exception as e:
        print("Caught Exception!")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    diagnose()
