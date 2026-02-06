import requests
import json
import sys
import re

# Force UTF-8 and flush
sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:8001"
# Login manually if needed, but for now assuming we can get token.
# Retrying login:
LOGIN_URL = f"{BASE_URL}/api/v1/auth/login/"
PROFILE_URL = f"{BASE_URL}/api/v1/auth/profile/"

def debug_test():
    try:
        print(f"DEBUG: Logging in to {LOGIN_URL}...")
        response = requests.post(LOGIN_URL, data={"email": "admin@psintellihr.com", "password": "adminpassword123"})
        if response.status_code == 200:
            print("DEBUG: Login successful!")
            tokens = response.json().get('tokens')
            access_token = tokens.get('access')
            
            # Profile
            print(f"DEBUG: Accessing profile at {PROFILE_URL}...")
            headers = {"Authorization": f"Bearer {access_token}"}
            profile_response = requests.get(PROFILE_URL, headers=headers)
            print(f"DEBUG: Profile Status Code: {profile_response.status_code}")
            
            if profile_response.status_code != 200:
                print("DEBUG: Profile access FAILED.")
                error_content = profile_response.text
                
                # NAIVE HTML CLEANUP
                # Remove script tags
                content = re.sub(r'<script.*?</script>', '', error_content, flags=re.DOTALL)
                # Remove style tags
                content = re.sub(r'<style.*?</style>', '', content, flags=re.DOTALL)
                # Remove generic tags
                content = re.sub(r'<[^>]+>', ' ', content)
                # Collapse whitespace
                content = re.sub(r'\s+', ' ', content).strip()
                
                print("\n\n--- CLEANED ERROR CONTENT ---")
                # Print in chunks to avoid truncation if possible, but for command_status we want it short?
                # Actually, command_status truncates. We need to print the START of the error.
                print(content[:5000])
                print("\n--- END CLEANED ERROR CONTENT ---")
                
                # Also try to grep for standard Python keywords
                print("\n--- GREP KEYWORD ---")
                if "Exception" in error_content:
                    idx = error_content.find("Exception Value")
                    if idx != -1:
                        print(error_content[idx:idx+500])
                
            else:
                print("DEBUG: Profile access SUCCESS!")
                
        else:
            print(f"DEBUG: Login failed with status {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"DEBUG: Exception during test: {e}")

if __name__ == "__main__":
    debug_test()
